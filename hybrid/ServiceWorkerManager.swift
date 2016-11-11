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
import EmitterKit

enum ServiceWorkerInstallState: Int {
    case Installing
    case Installed
    case Activating
    case Activated
    case Redundant
}

enum ServiceWorkerUpdateResult {
    case New
    case Failed
    case NoUpdateNeeded
    case UpdatedExisting
}

class ServiceWorkerMatch {
    
    func toSerializableObject() -> [String:AnyObject] {
        return [
            "instanceId": self.instanceId,
            "installState": self.installState.rawValue,
            "url": self.url.absoluteString!,
            "scope": self.scope.absoluteString!
        ]
    }
    
    var instanceId: Int!
    var installState: ServiceWorkerInstallState!
    var url:NSURL!
    var scope:NSURL!
    
    init(instanceId:Int, url:NSURL, installState: ServiceWorkerInstallState, scope: NSURL) {
        self.instanceId = instanceId
        self.installState = installState
        self.url = url
        self.scope = scope
    }

}

class ServiceWorkerDoesNotExistError : ErrorType {}
class ServiceWorkerNotHTTPSError : ErrorType {}


class ServiceWorkerManager {
    
    static let STATUS_CHANGE_EVENT = "service-worker-status-change"
    
    static let events = Event<ServiceWorkerMatch>()
    
    static var currentlyActiveServiceWorkers = [Int: ServiceWorkerInstance]()
    
    static func clearActiveServiceWorkers() {
        self.currentlyActiveServiceWorkers.removeAll(keepCapacity: false)
    }
    
   
    // Amazon S3, at least, seems to return headers in lowercase. So we need to accommodate that.
    static private func getHeaderCaseInsensitive(res:NSHTTPURLResponse, name:String) -> String? {
        let nameLowerCase = name.lowercaseString
        
        for (key, val) in res.allHeaderFields {
            if String(key).lowercaseString == nameLowerCase {
                return String(val)
            }
        }
        return nil
    }
    
    static private func HTTPDateToNSDate(httpDate:String) -> NSDate? {
        let dateFormat = NSDateFormatter()
        dateFormat.dateFormat = "EEE, dd MMM yyyy HH:mm:ss z"
        dateFormat.locale = NSLocale(localeIdentifier: "en_US_POSIX")
        
        let date = dateFormat.dateFromString(httpDate)
        return date
        
    }

    
    static private func getLastUpdated(url:NSURL) -> Promise<NSDate?> {
        
        let request = FetchRequest(url: url.absoluteString!, options: [
            "method": "HEAD"
        ])
        
        return GlobalFetch.fetchRequest(request)
        .then { response -> Promise<NSDate?> in
            let lastMod = response.headers.get("last-modified")
            
            var date:NSDate? = nil
            
            if lastMod != nil {
                date = HTTPDateToNSDate(lastMod!)
            }
            
            return Promise<NSDate?>(date)
            
        }
        
    }
    
    
    static func update(urlOfServiceWorker:NSURL, scope:NSURL? = nil) -> Promise<Int> {
        
        // Update spec is here: http://www.w3.org/TR/service-workers/#service-worker-registration-update-method
        
        return Promise<Void>()
        .then { () -> Promise<Int> in
            
            // Get the newest worker. Following spec here: http://www.w3.org/TR/service-workers/#get-newest-worker-algorithm
            
            // shorter way of saying it is grab workers in following order: activated, activating, installed, installing
            // so we use SQL to just select the first one, ordered by install state.
            
            var existingJS:String?
            var scopeToUse = scope
            var serviceWorkerId:Int?
            
            try Db.mainDatabase.inDatabase({ (db) in
                let result = try db.executeQuery("SELECT * FROM service_workers WHERE url = ? AND NOT install_state = ? ORDER BY install_state DESC LIMIT 1", values: [urlOfServiceWorker, ServiceWorkerInstallState.Redundant.rawValue])
                
                if result.next() == false {
                    
                    // If there's no existing service worker record, we must update
                    log.debug("No existing version for worker " + urlOfServiceWorker.absoluteString!)
                    result.close()
                    return
                }
                
                existingJS = String(data: result.dataForColumn("contents"), encoding: NSUTF8StringEncoding)
                serviceWorkerId = Int(result.intForColumn("instance_id"))
                
                // Confusion caused by combining update and register. Should separate at some point.
                
                if scopeToUse == nil {
                    scopeToUse = NSURL(string: result.stringForColumn("scope"))
                }
                result.close()
            })
     
            return GlobalFetch.fetch(urlOfServiceWorker.absoluteString!)
            .then { response -> Promise<Int> in
                
                let newJS = String(data: response.data!, encoding: NSUTF8StringEncoding)
                
                if existingJS != nil && existingJS == newJS {
                    // No new code, so just return the ID of the existing worker.
                    if existingJS == nil {
                        log.info("New worker to be installed at " + urlOfServiceWorker.absoluteString!)
                    } else {
                        log.info("Checked for update to " + urlOfServiceWorker.absoluteString! + ", but no change.")
                        
                    }
                    return Promise<Int>(serviceWorkerId!)
                }
                
                log.info("Installing new service worker from: " + urlOfServiceWorker.absoluteString!)
                
                return self.insertServiceWorkerIntoDB(
                    urlOfServiceWorker,
                    scope: scopeToUse!,
                    lastModified: -1, // TODO: remove column
                    js: response.data!
                ).then { id in
                    
                    // This happens async, so don't wrap up in the promise
                    self.installServiceWorker(id)
                    return Promise<Int>(id)
                }
                
            }
            
        }

    }
    
    static func getAllServiceWorkersForURL(pageURL:NSURL) -> Promise<[ServiceWorkerMatch]> {
        return Promise<Void>()
        .then {
            var workerRecords:[ServiceWorkerMatch] = [];
            
            try Db.mainDatabase.inDatabase({ (db) in
                
                let selectScopeQuery = "SELECT scope FROM service_workers WHERE ? LIKE (scope || '%') ORDER BY length(scope) DESC LIMIT 1"
                
                let allWorkersResultSet = try db.executeQuery("SELECT instance_id, install_state, url, scope FROM service_workers WHERE scope = (" + selectScopeQuery + ")", values: [pageURL.absoluteString!])
                
                
                while allWorkersResultSet.next() {
                    let instanceId = Int(allWorkersResultSet.intForColumn("instance_id"))
                    let installState = ServiceWorkerInstallState(rawValue: Int(allWorkersResultSet.intForColumn("install_state")))!
                    let url = NSURL(string: allWorkersResultSet.stringForColumn("url"))!
                    let scope = NSURL(string:allWorkersResultSet.stringForColumn("scope"))!
                    workerRecords.append(ServiceWorkerMatch(instanceId: instanceId, url: url, installState: installState, scope: scope))
                }
                
                allWorkersResultSet.close()
                
            })
            
            return Promise<[ServiceWorkerMatch]>(workerRecords)

        }
    }
    
    static func insertServiceWorkerIntoDB(serviceWorkerURL:NSURL, scope: NSURL, lastModified:NSTimeInterval, js:NSData, installState:ServiceWorkerInstallState = ServiceWorkerInstallState.Installing) -> Promise<Int> {
        
        
        
        return Promise<Void>()
        .then {
            
//            if serviceWorkerURL.host != "localhost" && (serviceWorkerURL.scheme == "http" || scope.scheme == "http") {
//                log.error("Both scope and service worker URL must be under HTTPS")
//                throw ServiceWorkerNotHTTPSError()
//            }
            
            var newId:Int64 = -1
            
            try Db.mainDatabase.inTransaction({ (db) in
                try db.executeUpdate("INSERT INTO service_workers (url, scope, last_modified, contents, install_state) VALUES (?,?,?,?,?)", values: [serviceWorkerURL.absoluteString!, scope.absoluteString!, lastModified, js, installState.rawValue ] as [AnyObject])
                
                newId = db.lastInsertRowId()
            })
            
            log.debug("Inserted service worker into DB for URL: " + serviceWorkerURL.absoluteString! + " with installation state " + String(installState))
            
            let match = ServiceWorkerMatch(instanceId: Int(newId), url: serviceWorkerURL, installState: installState, scope: scope)
            
            self.events.emit(STATUS_CHANGE_EVENT, match)
            
            return Promise<Int>(Int(newId))
        }
       
    }
    
    private static func updateServiceWorkerInstallState(id: Int, state:ServiceWorkerInstallState, updateDatabase:Bool = true) throws {
        
        let idAsNSNumber = NSNumber(longLong: Int64(id))
        
        if updateDatabase == true {
            try Db.mainDatabase.inTransaction({ (db:FMDatabase) in
                
                
                
                try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [state.rawValue, idAsNSNumber] as [AnyObject])
                
                if db.changes() == 0 {
                    throw ServiceWorkerDoesNotExistError()
                }
            })
        }
        
        var url:NSURL? = nil
        var scope:NSURL? = nil
        
        try Db.mainDatabase.inDatabase { (db) in
            
            let set = try db.executeQuery("SELECT url, scope FROM service_workers WHERE instance_id = ?", values: [idAsNSNumber])
            
            if set.next() == false {
                throw ServiceWorkerDoesNotExistError()
            }
            
            url = NSURL(string: set.stringForColumn("url"))
            scope = NSURL(string: set.stringForColumn("scope"))
            
            set.close()
        }
        
        
        
        if self.currentlyActiveServiceWorkers[id] != nil {
            self.currentlyActiveServiceWorkers[id]!.installState = state
        }
        
        let matchToDispatch = ServiceWorkerMatch(instanceId: id, url: url!, installState: state, scope: scope!)
        
        self.events.emit(STATUS_CHANGE_EVENT, matchToDispatch)
    }
    
    static func activateServiceWorker(id:Int) -> Promise<Void> {
        return ServiceWorkerInstance.getById(id)
        .then { swInstance in
            
            try self.updateServiceWorkerInstallState(id, state: ServiceWorkerInstallState.Activating)
            
            return swInstance!.dispatchExtendableEvent(ExtendableEvent(type: "activate"))
            .then { _ -> Void in
                
                // Activate was successful.
                // Now set all other workers for this scope to "redundant". Need to do a select
                // so that we can dispatch these same events to flag workers as redundant.
                
                // TODO: cleanup. Just delete the rows?
                
                var idsToInvalidate = [Int]()
                let idAsNSNumber = NSNumber(longLong: Int64(id))
                
                try Db.mainDatabase.inTransaction({ (db) in
                    let workersToMakeRedundant = try db.executeQuery("SELECT instance_id FROM service_workers WHERE url = ? AND NOT instance_id = ?", values: [swInstance!.url.absoluteString!, idAsNSNumber])
                    
                    while workersToMakeRedundant.next() {
                        idsToInvalidate.append(Int(workersToMakeRedundant.intForColumn("instance_id")))
                    }
                    
                    workersToMakeRedundant.close()
                    
                    // we're running these queries manually inside a transaction, so we know they all
                    // ran successfully.
                    
                    try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [ServiceWorkerInstallState.Activated.rawValue, idAsNSNumber] as [AnyObject])
                    
                    let placeholders = idsToInvalidate.map({ _ in
                        return "?"
                    }).joinWithSeparator(",")
                    
                    var params = [AnyObject]()
                    
                    params.append(ServiceWorkerInstallState.Redundant.rawValue)
                    
                    for id in idsToInvalidate {
                        params.append(id)
                    }
                    
        
                    try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id IN (" + placeholders + ")", values: params)

                })
                
                // now that we've committed the transaction, dispatch events
                
                try self.updateServiceWorkerInstallState(id, state: ServiceWorkerInstallState.Activated, updateDatabase: false)
                
                for oldWorkerId in idsToInvalidate {
                    try self.updateServiceWorkerInstallState(oldWorkerId, state: ServiceWorkerInstallState.Redundant, updateDatabase: false)
                }
            }
            
        }
    }
    
    
    static func installServiceWorker(id:Int) -> Promise<ServiceWorkerInstallState> {
        
        // Service workers run "install" events, and if successful, "activate" events.
        // If either of these fail, it's considered redundant and invalid. So that's
        // what we'll do!
        
        return ServiceWorkerInstance.getById(id)
        .then { (swInstance) -> Promise<ServiceWorkerInstallState> in
            return swInstance!.dispatchExtendableEvent(ExtendableEvent(type: "install"))
            .then { (_) -> Promise<ServiceWorkerInstallState> in
                
                try self.updateServiceWorkerInstallState(id, state: ServiceWorkerInstallState.Installed)
                
                let runActivate = swInstance!.executeJS("hybrid.__getSkippedWaitingStatus()").toBool()
                
                if runActivate == true {
                    log.info("Service worker " + swInstance!.url.absoluteString! + " called skipWaiting()")
                }
                
                if runActivate == false {
                    return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Installed)
                } else {
                    return self.activateServiceWorker(id)
                    .then { _ in
                        return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Activated)
                    }
                }
    
            }
            .recover { error -> Promise<ServiceWorkerInstallState> in
                
                // If an error occurred in either the installation or optional activation step,
                // mark the worker as redundant.
                log.error("Error during installation: " + String(error))
                try self.updateServiceWorkerInstallState(id, state: ServiceWorkerInstallState.Redundant)
                
                return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Redundant)
            }
           
        }
        
    }
    
    
    static private func attemptWorkerActivate(sw:ServiceWorkerInstance, instanceId:Int) -> Promise<Void> {
        
        return sw.dispatchExtendableEvent(ExtendableEvent(type: "activate"))
        .then { _ -> ServiceWorkerInstallState in
            log.info("Successfully activated service worker: " + sw.url.absoluteString!)
            return ServiceWorkerInstallState.Activated
        }
        .recover { error -> ServiceWorkerInstallState in
            log.error("Failed to activate service worker:" + (error as! JSContextError).message)
            return ServiceWorkerInstallState.Redundant
        }
        .then { newStatus in
            
            try Db.mainDatabase.inTransaction({ (db) in
                try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [newStatus.rawValue, instanceId])
                
                sw.installState = newStatus
            })
            
            let match = ServiceWorkerMatch(instanceId: instanceId, url: sw.url, installState: newStatus, scope: sw.scope)
            
            self.events.emit(STATUS_CHANGE_EVENT, match)
            
            return Promise<Void>()

        }
        
    }
    
    
    static func cycleThroughEligibleWorkers(workerIds:[Int]) -> Promise<ServiceWorkerInstance?> {
        if (workerIds.count == 0) {
            return Promise<ServiceWorkerInstance?>(nil)
        }
        let eligibleWorkerId = workerIds[0]
        
        return ServiceWorkerInstance.getById(eligibleWorkerId)
        .then { (sw) -> Promise<ServiceWorkerInstance?> in
            log.debug("Eligible service worker with install state: " + String(sw?.installState))
            if (sw?.installState == ServiceWorkerInstallState.Installed) {
                return self.attemptWorkerActivate(sw!, instanceId: eligibleWorkerId)
                .then {
                    return Promise<ServiceWorkerInstance?>(sw)
                }
            }
            
            return Promise<ServiceWorkerInstance?>(sw)
        }
        .then { sw in
            if sw?.installState == ServiceWorkerInstallState.Activated {
                return Promise<ServiceWorkerInstance?>(sw!)
            }
            
            return cycleThroughEligibleWorkers(Array(workerIds.dropFirst()))
        }
    }
    
    static func getServiceWorkerForURL(url:NSURL) -> Promise<ServiceWorkerInstance?> {
        
        for (_, sw) in self.currentlyActiveServiceWorkers {
            
            // If we have an active service worker serving this scope, then immediately
            // return it.
            
            if sw.scopeContainsURL(url) == true {
                return Promise<ServiceWorkerInstance?>(sw)
            }
        }
        
        // If we have no active service worker, we need to find if one matches. Also, if it
        // has a status of Installed, we need to activate it. BUT if that activation fails
        // we need to use an older, installed worker.
        
        return Promise<Void>()
        .then { () -> Promise<[Int]> in
            var workerIds = [Int]()
            
            try Db.mainDatabase.inDatabase({ (db) in
                // Let's first make sure we're selecting with the most specific scope
                
                let selectScopeQuery = "SELECT scope FROM service_workers WHERE ? LIKE (scope || '%') OR ? = scope ORDER BY length(scope) DESC LIMIT 1"
                
                let applicableWorkerResultSet = try db.executeQuery("SELECT instance_id FROM service_workers WHERE scope = (" + selectScopeQuery  + ") AND (install_state == ? OR install_state = ?) ORDER BY instance_id DESC", values: [url.absoluteString!, url.absoluteString!, ServiceWorkerInstallState.Activated.rawValue, ServiceWorkerInstallState.Installed.rawValue])
               
                while applicableWorkerResultSet.next() {
                    workerIds.append(Int(applicableWorkerResultSet.intForColumn("instance_id")))
                }
                applicableWorkerResultSet.close()

            })
            
            return Promise<[Int]>(workerIds)
        }
        .then { ids in
            if (ids.count == 0) {
                return Promise<ServiceWorkerInstance?>(nil)
            }
            return self.cycleThroughEligibleWorkers(ids)
            .then { eligibleWorker in
//                if (eligibleWorker != nil) {
//                    self.currentlyActiveServiceWorkers.append(eligibleWorker!)
//                }
                return Promise<ServiceWorkerInstance?>(eligibleWorker)
            }
        }
        
        
        }
        
        
        
    }
