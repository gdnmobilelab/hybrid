//
//  ServiceWorkerManager.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import FMDB
import JavaScriptCore


/// The various states a Service Worker can exist in. As outlined in: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorker/state
///
/// - Installing: The worker is currently in the process of installing
/// - Installed: The worker has successfully installed and is awaiting activation
/// - Activating: The worker is currently in the process of activating
/// - Activated: The worker is activated and ready to receive events and messages
/// - Redundant: The worker has either failed to install or has been superseded by a new version of the worker.
enum ServiceWorkerInstallState: Int {
    case installing
    case installed
    case activating
    case activated
    case redundant
}


/// Used in service worker events. We can't send the worker itself as a payload as
/// we send this into our HybridWebView, where we can only transfer primitives. So we
/// pass this around and use ServiceWorkerInstance.getById() to grab again when
/// the HybridWebView sends a response
class ServiceWorkerMatch {
    
    
    /// Convert this into an object containing string/int primitives that can be
    /// JSON encoded successfully. If you don't use this, JSONSerialization will fail.
    ///
    /// - Returns: AnyObject that is serializable.
    func toSerializableObject() -> [String:AnyObject] {
        return [
            "instanceId": self.instanceId as AnyObject,
            "installState": self.installState.rawValue as AnyObject,
            "url": self.url.absoluteString as AnyObject,
            "scope": self.scope.absoluteString as AnyObject
        ]
    }
    
    var instanceId: Int!
    var installState: ServiceWorkerInstallState!
    var url:URL!
    var scope:URL!
    
    init(instanceId:Int, url:URL, installState: ServiceWorkerInstallState, scope: URL) {
        self.instanceId = instanceId
        self.installState = installState
        self.url = url
        self.scope = scope
    }

}


/// This error is thrown when we have assumed that a service worker exists when it actually does not.
class ServiceWorkerDoesNotExistError : Error {}


/// Service Workers must be served over HTTPS. This will be thrown when you attempt to load
/// a service worker over HTTP.
class ServiceWorkerNotHTTPSError : Error {}


/// The ServiceWorkerManager is responsible for managing the worker lifecycle itself -
/// installing, updating, etc. etc., as well as retreiving service worker instances based
/// on service worker scopes.
class ServiceWorkerManager {
    
    /// Just a static string for us to ensure we are using the right event
    /// name when attaching listeners
    static let STATUS_CHANGE_EVENT = "service-worker-status-change"
    
    /// EmitterKit event handler that is used whenever a service worker state changes
    static let events = EventEmitter<ServiceWorkerMatch>()
    
    
    /// A map of current, in-use service workers. We use this to ensure that we don't
    /// ever create more than one instance of a worker.
    static var currentlyActiveServiceWorkers = [Int: ServiceWorkerInstance]()
    
    
    /// Empty our map of service workers. This is (currently) only used in tests, to
    /// clear out existing workers.
    static func clearActiveServiceWorkers() {
        self.currentlyActiveServiceWorkers.removeAll(keepingCapacity: false)
    }
    
    
    /// Send a HEAD request to the URL specified and turn the resulting
    /// Last-Modified header into an NSDate
    ///
    /// - Parameter url: URL to fetch
    /// - Returns: NSDate if the Last-Modified header exists, nil if it doesn't
    static fileprivate func getLastModified(_ url:NSURL) -> Promise<Date?> {
        
        let request = FetchRequest(url: url.absoluteString!, options: [
            "method": "HEAD"
        ])
        
        return GlobalFetch.fetchRequest(request)
        .then { response in
            let lastMod = response.headers.get("last-modified")
            
            var date:Date? = nil
            
            if lastMod != nil {
                date = Util.HTTPDateToNSDate(lastMod!)
            }
            
            return Promise(value: date)
            
        }
        
    }
    
    
    /// Fetch a stub of the newest worker for a given URL, with following order: activated,
    /// activating, installed, installing
    ///
    /// - Parameter urlOfWorker: the URL to query in the database
    /// - Returns: a ServiceWorkerStub, if the worker exists. The stub just contains metadata, rather than a full instance.
    /// - Throws: If the database connection fails, will throw an error.
    fileprivate static func getNewestWorker(_ urlOfWorker:URL) throws -> ServiceWorkerStub? {
        
        var stub:ServiceWorkerStub? = nil
        
        try Db.mainDatabase.inDatabase({ (db) in
            let result = try db.executeQuery("SELECT * FROM service_workers WHERE url = ? AND NOT install_state = ? ORDER BY install_state DESC LIMIT 1", values: [urlOfWorker, ServiceWorkerInstallState.redundant.rawValue])
            
            if result.next() == false {
                result.close()
                return
            }
            
            let headers = try FetchHeaders.fromJSON(result.string(forColumn: "headers"))
            
            stub = ServiceWorkerStub(
                instanceId: Int(result.int(forColumn: "instance_id")),
                installState: ServiceWorkerInstallState(rawValue: Int(result.int(forColumn: "install_state")))!,
                lastChecked: Int(result.int(forColumn: "last_checked")),
                lastModified: headers.get("last-modified"),
                etag: headers.get("etag"),
                scope: URL(string: result.string(forColumn: "scope"))!,
                jsHash: Util.sha256String(String(data: result.data(forColumn: "contents"), encoding: String.Encoding.utf8)!)
            )

            result.close()
        })
        
        return stub
        
    }
    
    
    /// Update or register a service worker from a remote URL. The bulk of what the manager is responsible for.
    /// Emits events on ServiceWorkerManager.events when a worker state changes.
    ///
    /// Follows (loosely!) the spec outlined here: http://www.w3.org/TR/service-workers/#service-worker-registration-update-method
    ///
    /// - Parameters:
    ///   - urlOfServiceWorker: The URL for the JavaScript file containing the service worker
    ///   - scope: If registering a new worker, the scope to register under. Optional, as when updating we use the existing scope.
    ///   - forceCheck: By default, register() only checks the remote URL once every 24 hours. But update() forces it.
    /// - Returns: A promise containing the instance ID of the newly installed worker.
    static func update(_ urlOfServiceWorker:URL, scope:URL? = nil, forceCheck:Bool = false) -> Promise<Int> {
        
        return Promise(value: ())
        .then { () -> Promise<Int> in
            
            let newest = try self.getNewestWorker(urlOfServiceWorker)
            
            
            // If our worker is installing or activating, then we return the existing one rather than start a new check loop
            
            if let swState = newest?.installState {
                if swState != ServiceWorkerInstallState.activated && swState != ServiceWorkerInstallState.redundant {
                    log.info("Worker currently in install or activate state - returning existing instance")
                    return Promise(value: newest!.instanceId)
                }
            }
            
            // Service Worker API (in Chrome at least?) doesn't try to download new JS if it's already
            // checked within the last 24 hours. So we want to mirror that same behaviour.
            
            let timeDiff = 60 * 60 * 24 // 24 hours in seconds
            
            let rightNow = Int(NSDate().timeIntervalSince1970)
            
            if newest != nil && newest!.lastChecked + timeDiff > rightNow && forceCheck == false {
                // We've checked within the last 24 hours. So just return the existing worker
                log.info("Existing worker has been checked within 24 hours. Returning")
                
                return Promise(value: newest!.instanceId)
                
            }
     
            let request = FetchRequest(url: urlOfServiceWorker.absoluteString, options: nil)
            
            if newest?.lastModified != nil {
                
                // If we have one already and a Last-Modified header, then we can return a 304
                // if the content hasn't actually changed.
                
                request.headers.append("If-Modified-Since", value: newest!.lastModified!)
            }
            
            if newest?.etag != nil {
                
                // Same with ETag
                
                request.headers.append("If-None-Match", value: newest!.etag!)
                
            }
            
            
            return GlobalFetch.fetchRequest(request)
            .then { response -> Promise<Int> in
                
                if response.status == 304 {
                    // Not modified. Don't try to read the data as it isn't there.
                    log.info("Checked for update to " + urlOfServiceWorker.absoluteString + ", received a 304.")
                    return Promise(value: newest!.instanceId)
                }
                
                if response.status < 200 || response.status > 299 {
                    log.error("Checked for update to " + urlOfServiceWorker.absoluteString + ", received a non-200 response: " + String(response.status))
                    return Promise(value: newest!.instanceId)
                }
            
                let downloadedJS = String(data: response.data!, encoding: String.Encoding.utf8)!
                let downloadedJSHash = Util.sha256String(downloadedJS)
                
                if newest != nil && downloadedJSHash == newest!.jsHash {
                    // No new code, so just return the ID of the existing worker.
                    log.info("Checked for update to " + urlOfServiceWorker.absoluteString + ", but no change.")
                    
                    try Db.mainDatabase.inTransaction { db in
                        // Update the DB with our new last checked time
                        try db.executeUpdate("UPDATE service_workers SET last_checked = ? WHERE instance_id = ?", values: [rightNow, newest!.instanceId])
                    }

                    return Promise(value: newest!.instanceId)
                }
                
                log.info("Installing new service worker from: " + urlOfServiceWorker.absoluteString)
                
                let scopeToUse = scope != nil ? scope! : newest!.scope
                
                return self.insertServiceWorkerIntoDB(
                    urlOfServiceWorker,
                    scope: scopeToUse,
                    lastChecked: rightNow,
                    js: response.data!,
                    headers: response.headers
                ).then { id in
                    
                    // This happens async, so don't wrap up in the promise
                    self.installServiceWorker(id)
                    .catch { err in
                        log.error("Error installing service worker: " + String(describing: err))
                    }
                    return Promise(value: id)
                }
                
            }
            
        }

    }
    
    
    /// Return an array of ServiceWorkerMatches for all the workers whose scope contains the specified
    /// URL. Includes workers of all states (installing, etc)
    ///
    /// - Parameter pageURL: The URL we want to check
    /// - Returns: A promise of a ServiceWorkerMatch array. If no matches, will be empty.
    static func getAllServiceWorkersWithScopeContainingURL(_ pageURL:URL) -> Promise<[ServiceWorkerMatch]> {
        return Promise(value: ())
        .then {
            var workerRecords:[ServiceWorkerMatch] = [];
            
            try Db.mainDatabase.inDatabase({ (db) in
                
                let selectScopeQuery = "SELECT scope FROM service_workers WHERE ? LIKE (scope || '%') ORDER BY length(scope) DESC LIMIT 1"
                
                let allWorkersResultSet = try db.executeQuery("SELECT instance_id, install_state, url, scope FROM service_workers WHERE scope = (" + selectScopeQuery + ")", values: [pageURL.absoluteString])
                
                
                while allWorkersResultSet.next() {
                    let instanceId = Int(allWorkersResultSet.int(forColumn: "instance_id"))
                    let installState = ServiceWorkerInstallState(rawValue: Int(allWorkersResultSet.int(forColumn: "install_state")))!
                    let url = URL(string: allWorkersResultSet.string(forColumn: "url"))!
                    let scope = URL(string:allWorkersResultSet.string(forColumn: "scope"))!
                    workerRecords.append(ServiceWorkerMatch(instanceId: instanceId, url: url, installState: installState, scope: scope))
                }
                
                allWorkersResultSet.close()
                
            })
            
            return Promise(value: workerRecords)

        }
    }
    
    /// Actually insert the worker's JavaScript source into the database
    ///
    /// - Parameters:
    ///   - serviceWorkerURL: The URL this source came from
    ///   - scope: The scope for this worker
    ///   - lastChecked: Second-based timestamp of the time this was downloaded
    ///   - js: The JavaScript string itself
    ///   - installState: The ServiceWorkerInstallState. Default is "installing" but we can override, e.g. for tests
    /// - Returns: A promise returning the instance ID of the inserted worker.
    static func insertServiceWorkerIntoDB(_ serviceWorkerURL:URL, scope: URL, lastChecked:Int, js:Data, headers: FetchHeaders, installState:ServiceWorkerInstallState = ServiceWorkerInstallState.installing) -> Promise<Int> {
        
        return Promise(value: ())
        .then {
            
            if serviceWorkerURL.host != "localhost" && (serviceWorkerURL.scheme == "http" || scope.scheme == "http") {
                log.error("Both scope and service worker URL must be under HTTPS")
//                throw ServiceWorkerNotHTTPSError()
            }
            
            var newId:Int64 = -1
            
            try Db.mainDatabase.inTransaction({ (db) in
                try db.executeUpdate("INSERT INTO service_workers (url, scope, last_checked, contents, headers, install_state) VALUES (?,?,?,?,?,?)", values: [serviceWorkerURL.absoluteString, scope.absoluteString, lastChecked, js, headers.toJSON(), installState.rawValue ])
                
                newId = db.lastInsertRowId()
            })
            
            log.debug("Inserted service worker into DB for URL: " + serviceWorkerURL.absoluteString + " with installation state " + String(describing: installState))
            
            let match = ServiceWorkerMatch(instanceId: Int(newId), url: serviceWorkerURL, installState: installState, scope: scope)
            
            self.events.emit(STATUS_CHANGE_EVENT, match)
            
            return Promise(value: Int(newId))
        }
       
    }
    
    
    /// Update the state of a worker in the database, as well as emit events accordingly.
    ///
    /// - Parameters:
    ///   - id: The instance ID to update
    ///   - state: The new install state
    ///   - updateDatabase: Whether we should update the database or not. Sometimes this has already been done and we just want to send events (need to tweak this)
    /// - Throws: An error if database connectivity fails
    fileprivate static func updateServiceWorkerInstallState(_ id: Int, state:ServiceWorkerInstallState, updateDatabase:Bool = true) throws {
        
        let idAsNSNumber = NSNumber(value: Int64(id) as Int64)
        
        if updateDatabase == true {
            try Db.mainDatabase.inTransaction({ (db:FMDatabase) in
                
                try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [state.rawValue, idAsNSNumber])
                
                if db.changes() == 0 {
                    throw ServiceWorkerDoesNotExistError()
                }
            })
        }
        
        var url:URL? = nil
        var scope:URL? = nil
        
        try Db.mainDatabase.inDatabase { (db) in
            
            let set = try db.executeQuery("SELECT url, scope FROM service_workers WHERE instance_id = ?", values: [idAsNSNumber])
            
            if set.next() == false {
                throw ServiceWorkerDoesNotExistError() as Error
            }
            
            url = URL(string: set.string(forColumn: "url"))
            scope = URL(string: set.string(forColumn: "scope"))
            
            set.close()
        }
        
        
        
        if self.currentlyActiveServiceWorkers[id] != nil {
            if state == ServiceWorkerInstallState.redundant {
                log.info("Removing redundant manager from currently active list")
                self.currentlyActiveServiceWorkers.removeValue(forKey: id)
            } else {
                self.currentlyActiveServiceWorkers[id]!.installState = state
            }
        }
        
        let matchToDispatch = ServiceWorkerMatch(instanceId: id, url: url!, installState: state, scope: scope!)
        
        self.events.emit(STATUS_CHANGE_EVENT, matchToDispatch)
    }
    
    
    /// Run an "activate" event inside the worker
    ///
    /// - Parameter swInstance: The instance we want to activate
    /// - Returns: A promise that waits until the "activate" ExtendedEvent completes.
    static func activateServiceWorker(_ swInstance:ServiceWorkerInstance) -> Promise<Void> {
        return Promise(value: ())
        .then {
            try self.updateServiceWorkerInstallState(swInstance.instanceId, state: ServiceWorkerInstallState.activating)
            
            return swInstance.dispatchExtendableEvent(ExtendableEvent(type: "activate"))
            .then { _ -> Void in
                
                // Activate was successful.
                // Now set all other workers for this scope to "redundant". Need to do a select
                // so that we can dispatch these same events to flag workers as redundant.
                
                // TODO: cleanup. Just delete the rows?
                
                var idsToInvalidate = [Int]()
                
                try Db.mainDatabase.inTransaction({ (db) in
                    let workersToMakeRedundant = try db.executeQuery("SELECT instance_id FROM service_workers WHERE url = ? AND NOT instance_id = ?", values: [swInstance.url.absoluteString, swInstance.instanceId])
                    
                    while workersToMakeRedundant.next() {
                        idsToInvalidate.append(Int(workersToMakeRedundant.int(forColumn: "instance_id")))
                    }
                    
                    workersToMakeRedundant.close()
                    
                    // we're running these queries manually inside a transaction, so we know they all
                    // ran successfully.
                    
                    try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [ServiceWorkerInstallState.activated.rawValue, swInstance.instanceId])
                    
                    // FMDB doesn't support arrays, so we have to manually create our query string with the right number of ?
                    // characters for the number of values we're going to input
                    
                    let placeholders = idsToInvalidate.map({ _ in
                        return "?"
                    }).joined(separator: ",")
                    
                    var params = [Any]()
                    
                    params.append(ServiceWorkerInstallState.redundant.rawValue)
                    
                    for id in idsToInvalidate {
                        params.append(id)
                    }
                    
        
                    try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id IN (" + placeholders + ")", values: params)

                })
                
                // now that we've committed the transaction, dispatch events
                
                try self.updateServiceWorkerInstallState(swInstance.instanceId, state: ServiceWorkerInstallState.activated, updateDatabase: false)
                
                for oldWorkerId in idsToInvalidate {
                    try self.updateServiceWorkerInstallState(oldWorkerId, state: ServiceWorkerInstallState.redundant, updateDatabase: false)
                }
            }
            
        }
    }
    
    
    /// Run an "install" event on a service worker, where it typically adds items to the cache etc. If the
    /// worker calls self.skipWaiting() as part of the install process, it will immediately move onto the
    /// activation event.
    ///
    /// - Parameter id: The instance ID of the worker to install
    /// - Returns: A promise containing the resulting install state - either Installed, Activated or Redundant if either step fails
    static func installServiceWorker(_ id:Int) -> Promise<ServiceWorkerInstallState> {
        
        // Service workers run "install" events, and if successful, "activate" events.
        // If either of these fail, it's considered redundant and invalid. So that's
        // what we'll do!
        
        return ServiceWorkerInstance.getById(id)
        .then { (swInstance) -> Promise<ServiceWorkerInstallState> in
            return swInstance!.dispatchExtendableEvent(ExtendableEvent(type: "install"))
            .then { (_) -> Promise<ServiceWorkerInstallState> in
                
                try self.updateServiceWorkerInstallState(id, state: ServiceWorkerInstallState.installed)
                
                let runActivate = swInstance!.globalScope.skipWaitingStatus
                
                if runActivate == true {
                    log.info("Service worker " + swInstance!.url.absoluteString + " called skipWaiting()")
                }
                
                if runActivate == false {
                    return Promise(value: ServiceWorkerInstallState.installed)
                } else {
                    return self.activateServiceWorker(swInstance!)
                    .then { _ in
                        return Promise(value: ServiceWorkerInstallState.activated)
                    }
                }
    
            }
            .recover { error -> Promise<ServiceWorkerInstallState> in
                
                // If an error occurred in either the installation or optional activation step,
                // mark the worker as redundant.
                log.error("Error during installation: " + String(describing: error))
                try self.updateServiceWorkerInstallState(id, state: ServiceWorkerInstallState.redundant)
                
                return Promise(value: ServiceWorkerInstallState.redundant)
            }
           
        }
        
    }
    
    
    /// If we have multiple workers for a URL, we want to cycle through them and see if any are
    /// at an Installed state and pending activation. If so, we want to try activating it, but if
    /// it fails, move onto the next worker.
    ///
    /// - Parameter workerIds: array of worker instance IDs
    /// - Returns: A promise containing an active service worker. Nil if there isn't one.
    static func cycleThroughEligibleWorkers(_ workerIds:[Int]) -> Promise<ServiceWorkerInstance?> {
        if (workerIds.count == 0) {
            return Promise<ServiceWorkerInstance?>(value: nil)
        }
        
        return ServiceWorkerInstance.getById(workerIds.first!)
        .then { (sw) -> Promise<ServiceWorkerInstance?> in
            log.debug("Eligible service worker with install state: " + String(describing: sw!.installState))
            if (sw!.installState == ServiceWorkerInstallState.installed) {
                return self.activateServiceWorker(sw!)
                .then {
                    return Promise(value: sw)
                }
            }
            
            return Promise(value: sw)
        }
        .then { sw in
            if sw?.installState == ServiceWorkerInstallState.activated {
                return Promise(value: sw!)
            }
            
            return cycleThroughEligibleWorkers(Array(workerIds.dropFirst()))
        }
    }
    
    
    /// Return a service worker with a scope that contains the provided URL.
    ///
    /// - Parameter url: The URL to match
    /// - Returns: A promise containing a service worker, or nil if there is no scope match.
    static func getServiceWorkerWhoseScopeContainsURL(_ url:URL) -> Promise<ServiceWorkerInstance?> {
        
        for (_, sw) in self.currentlyActiveServiceWorkers {
            
            // If we have an active service worker serving this scope, then immediately
            // return it.
            
            if sw.scopeContainsURL(url) == true {
                return Promise(value: sw)
            }
        }
        
        // If we have no active service worker, we need to find if one matches. Also, if it
        // has a status of Installed, we need to activate it. BUT if that activation fails
        // we need to use an older, installed worker.
        
        return Promise(value: ())
        .then { () -> Promise<[Int]> in
            var workerIds = [Int]()
            
            try Db.mainDatabase.inDatabase({ (db) in
                // Let's first make sure we're selecting with the most specific scope
                
                let selectScopeQuery = "SELECT scope FROM service_workers WHERE ? LIKE (scope || '%') OR ? = scope ORDER BY length(scope) DESC LIMIT 1"
                
                let applicableWorkerResultSet = try db.executeQuery("SELECT instance_id FROM service_workers WHERE scope = (" + selectScopeQuery  + ") AND (install_state == ? OR install_state = ?) ORDER BY instance_id DESC", values: [url.absoluteString, url.absoluteString, ServiceWorkerInstallState.activated.rawValue, ServiceWorkerInstallState.installed.rawValue])
               
                while applicableWorkerResultSet.next() {
                    workerIds.append(Int(applicableWorkerResultSet.int(forColumn: "instance_id")))
                }
                applicableWorkerResultSet.close()

            })
            
            return Promise(value: workerIds)
        }
        .then { ids in
            if (ids.count == 0) {
                return Promise<ServiceWorkerInstance?>(value: nil)
            }
            return self.cycleThroughEligibleWorkers(ids)
            .then { eligibleWorker in
//                if (eligibleWorker != nil) {
//                    self.currentlyActiveServiceWorkers.append(eligibleWorker!)
//                }
                return Promise(value: eligibleWorker)
            }
        }
        
        
    }
    
    
    /// When in the background or when we're woken up, we need to fetch all the push
    /// events that have occured while the app was inactive and process them.
    ///
    /// - Returns: A promise that resolves when all push events have been processed.
    static func processAllPendingPushEvents() -> Promise<Void> {
        
        let pushEvents = PendingPushEventStore.getAll()
        
        log.info("Processing " + String(pushEvents.count) + " pending push events")
        
        let workerURLs = pushEvents.map { $0.serviceWorkerURL }
        
        let uniqueWorkerURLs = Set(workerURLs)

        let pushPromises = uniqueWorkerURLs.map { workerURL in
            return ServiceWorkerInstance.getActiveWorkerByURL(URL(string: workerURL)!)
            .then { sw -> Promise<Void> in
                
                if sw == nil {
                    log.error("Received push event for " + workerURL + " but no worker existed to handle it.")
                    PendingPushEventStore.getByWorkerURL(workerURL).forEach { PendingPushEventStore.remove($0) }
                    return Promise(value: ())
                }
                
                // processPendingPushEvents() is called in loadServiceWorker() so there's
                // a good chance this will do nothing, but if the worker is already created
                // and active in memory we need to manually trigger this.
                
                log.info("Processing push events for " + workerURL)
                
                return sw!.processPendingPushEvents()
            }
        }
        
        return when(fulfilled: pushPromises)
        .then { () -> () in
            let checkAll = PendingPushEventStore.getAll()
            if checkAll.count > 0 {
                log.error("There are still pending push events after processing")
            }
        }
    }
        
        
        
    }
