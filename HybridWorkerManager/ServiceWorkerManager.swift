//
//  ServiceWorkerManager.swift
//  hybrid
//
//  Created by alastair.coote on 08/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker
import HybridShared
import PromiseKit


/// This class manages the lifecycle of app service worker instances, primarily installing, updating
/// and changing the status of connected workers accordingly (e.g. setting an older worker to redundant
/// once a new version has been installed)
public class ServiceWorkerManager : JSEventEmitter {
    
    var activeServiceWorkers = Set<ServiceWorkerInstanceBridge>()
    let store = ServiceWorkerStore()
    
//    public let lifecycleEvents = EventEmitter<ServiceWorkerEvent>()

    public var activeInstances: [ServiceWorkerInstance] {
        get {
            return self.activeServiceWorkers.map { $0.instance }
        }
    }
    
    
    /// Destroys all currently active service workers and removes them from the
    /// currentlyActiveServiceWorkers set.
    public func clearActiveServiceWorkers() {
        
        self.activeServiceWorkers.forEach { active in
            active.instance.destroy()
        }
        
        self.activeServiceWorkers.removeAll()
    }
    
    public func getWorkers(forScope: URL, options: [ScopeOptions], withState:[ServiceWorkerInstallState]) -> Promise<[ServiceWorkerInstance]> {
        return Promise(value: ())
        .then {
            
            let matchingWorkers = try self.store.getAllWorkerRecords(forScope: forScope, options: options)
            
            let matchingStatusWorkers = matchingWorkers.filter { withState.contains($0.installState) }
            
            let workerCreatePromises = matchingStatusWorkers.map { self.getOrCreateWorker(forId: $0.id) }
            
            return when(fulfilled: workerCreatePromises)
                .then { results in
                    return Promise(value: results.map { $0.instance })
            }
                
        }
    }
    
    public func getAllNonRedundantWorkers(forScope: URL, options: [ScopeOptions]) -> Promise<[ServiceWorkerInstance]> {
        
        return self.getWorkers(forScope: forScope, options: options, withState: [.activated, .activating, .installed, .installing])
        
    }
    
    func getOrCreateWorker(forId: Int) -> Promise<ServiceWorkerInstanceBridge> {
        
        return Promise(value: ())
        .then {
            
            let existingWorker = self.activeServiceWorkers.filter { $0.id == forId }.first
            
            if existingWorker != nil {
                return Promise(value: existingWorker!)
            }
            
            let contents = try self.store.getWorkerContent(byId: forId)
            let record = try self.store.getAllWorkerRecords(forIds: [forId]).first!
            
            return ServiceWorkerInstanceBridge.create(record: record, contents: contents, manager: self)
            .then { activeWorker in
                self.activeServiceWorkers.insert(activeWorker)
                
                
                // We fire this event so any existing registrations pick up on the existence of the worker
                self.dispatchEvent(PendingWorkerStateChangeEvent(worker: activeWorker.instance, newState: .installing))
                return Promise(value: activeWorker)
            }
        }
        
    }
    
    public func makeWorkerRedundant(worker: ServiceWorkerInstance) -> Promise<Void> {
        
        return Promise(value:())
        .then { () -> Void in
            
            let bridge = self.activeServiceWorkers.filter { $0.instance == worker }.first
            
            if bridge == nil {
                throw ErrorMessage("Worker instance is not in active list for this manager. Is it from a different manager?")
            }
            
            try self.updateWorkerStatuses([UpdateStatusInstruction(id: bridge!.id, newState: ServiceWorkerInstallState.redundant)])
            
            bridge!.instance.destroy()
            
            self.activeServiceWorkers.remove(bridge!)
            
        }
        
        
        
    }
    
    
    /// Because there are security implications for allowing service workers, we manually control
    /// which domains are allowed to install service workers via this app and which are not.
    public func workerURLIsAllowed(url:URL) -> Bool {
        return SharedResources.allowedServiceWorkerDomains.contains("*") == true ||
            SharedResources.allowedServiceWorkerDomains.contains(url.host!) == true
    }
    
    
    /// Grab the latest content from the remote URL. Queries our existing workers and fetches
    /// ETag and Last-Modified headers if applicable, to stop us downloading the entire content
    func grabNewContent(url: URL, scope: URL) -> Promise<FetchResponse?> {
        return Promise(value: ())
        .then { () -> Promise<FetchResponse> in
                
            if self.workerURLIsAllowed(url: url) == false {
                log.error("Attempt to register a worker on a forbidden URL:" + url.absoluteString)
                throw ErrorMessage("Domain is not in the list of approved worker domains")
            }
            
            log.info("Attempting to update worker at URL: " + url.absoluteString)
            
            let existingWorkers = try self.store.getAllWorkerRecords(forURL: url, withScope: scope)
            
            // TODO: if we already have an activating worker, wait?
            
            // If a worker already exists for this URL and scope, we want to grab the ETag
            // and Last-Modified headers for that worker. That way, if the remote content
            // hasn't changed we'll just get a 304.
            
            var lastModified:String? = nil
            var eTag:String? = nil
            
            // There should only be one active worker. But just in case, we'll get the most
            // recent one.
            
            let mostRecentActiveWorker = existingWorkers
                .filter { $0.installState == ServiceWorkerInstallState.activated }
                .sorted { $1.id > $0.id }
                .first
            
            if mostRecentActiveWorker != nil {
                log.info("Existing worker found, attaching headers from previous response")
            } else {
                log.info("No existing worker, requesting without additional headers")
            }
            
            lastModified = mostRecentActiveWorker?.headers.get("last-modified")
            eTag = mostRecentActiveWorker?.headers.get("etag")
            
            let requestHeaders = FetchHeaders()
            
            if let lastModifiedExists = lastModified {
                requestHeaders.set("If-Modified-Since", value: lastModifiedExists)
            }
            
            if let eTagExists = eTag {
                requestHeaders.set("If-None-Match", value: eTagExists)
            }
            
            let request = FetchRequest(url: url.absoluteString, options: ["headers": requestHeaders])
            
            return GlobalFetch.fetch(request: request)
        }
        .then { response in
            
            if response.status == 304 {
                log.info("Request for worker returned a 304 not-modified status. Returning.")
                return Promise(value: nil)
            }
            
            if response.ok == false {
                log.info("Request for worker returned a non-OK response: " + String(response.status))
                // If we're not OK and it isn't a 304, it's not a response we're expecting.
                throw ErrorMessage("Attempt to update worker resulted in status code " + String(response.status))
            }
            
            return Promise(value: response)
        }

    }
    
    /// An attempt to mirror ServiceWorkerRegistration.update(), as outlined here:
    /// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/update
    ///
    /// - Parameters:
    ///   - url: URL of the worker to download
    ///   - scope: The scope we're updating - need to supply, unlike in the Web API
    /// - Returns: A promise that resolves to nil if update was successful (this includes
    ///            an update that was not needed). Throws if we can't check.
    public func update(url: URL, scope: URL) -> Promise<Void> {

        return self.grabNewContent(url: url, scope: scope)
        .then { newResponse in
            if newResponse == nil {
                return Promise(value:())
            } else {
                log.info("Request for worker returned an OK response, installing new worker...")
                return self.installServiceWorker(url: url, scope: scope, response: newResponse!, waitForFullInstallCycle: true)
            }
        }
        
    }
    
    
    /// An attempt to mirror ServiceWorkerContainer.register(), as outlined here:
    /// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerContainer/register
    ///
    /// The primary difference to update() is that this does not wait for the full install/activate
    /// lifecycle to complete - the promise returns whenever the worker is at installing.
    public func register(url: URL, scope: URL) -> Promise<Void> {
        
        return self.grabNewContent(url: url, scope: scope)
        .then { newResponse in
            if newResponse == nil {
                return Promise(value:())
            } else {
                log.info("Request for worker returned an OK response, installing new worker...")
                return self.installServiceWorker(url: url, scope: scope, response: newResponse!, waitForFullInstallCycle: false)
            }
        }
        
    }
    
    
    func installServiceWorker(url: URL, scope: URL, response: FetchResponse, waitForFullInstallCycle: Bool) -> Promise<Void> {
        return response.text()
        .then { contents in
            
            let newWorkerId = try self.store.insertWorkerIntoDatabase(url, scope: scope, contents: contents, headers: response.headers)
            
            return self.getOrCreateWorker(forId: newWorkerId)
            .then { worker in
                
                log.info("Running install event for worker...")
                let installEvent = InstallEvent()
                
                // This promise will run no matter what, but underneath we control whether we
                // want to wait for it to complete or not.
                
                worker.instance.globalScope.dispatchEvent(installEvent)
                
                let installEventPromise = installEvent.resolve()
                
//                let installEventPromise = worker.instance.globalScope.dispatchExtendableEvent(installEvent)
                .then { () -> Promise<Void> in
                    let allWorkersForURL = try self.store.getAllWorkerRecords(forURL: url, withScope: scope)
                    
                    // Shouldn't really happen, but there's a chance there is already a worker in the installed
                    // state. If so, we need to clear it out.
                    
                    var updateInstructions = allWorkersForURL
                        .filter { $0.installState == ServiceWorkerInstallState.installed }
                        .map { UpdateStatusInstruction(id: $0.id, newState: ServiceWorkerInstallState.redundant) }
                    
                    log.info("Worker installed successfully, setting " + String(updateInstructions.count) + " workers to redundant and this to installed")
                    
                    // Then set our new worker to installed state.
                    updateInstructions.append(UpdateStatusInstruction(id: newWorkerId, newState: ServiceWorkerInstallState.installed))
                    
                    // Actually run the updates
                    try self.updateWorkerStatuses(updateInstructions)
                    
                    // We move onto activate immediately in two situations:
                    // 1) skipWaiting has been called
                    // 2) there is no active worker on this scope
                    
                    let activeOrActivatingWorkers = try self.store.getAllWorkerRecords(forScope: scope, options: [])
                        .filter { $0.installState == .activated || $0.installState == .activating }
                    
                    if worker.instance.skipWaitingStatus == true || activeOrActivatingWorkers.count == 0 {
                        if worker.instance.skipWaitingStatus == true {
                            log.info("Worker called skipWaiting(), activating immediately")
                        } else {
                            log.info("There is no active worker for this scope, activating immediately")
                        }
                        
                        return self.activateServiceWorker(worker: worker.instance, id: newWorkerId)
                    } else {
                        log.info("Worker did not call skipWaiting(), leaving at installed status")
                    }
                    
                    return Promise(value:())
                        
                }


                    
                if waitForFullInstallCycle == false {
                    // If we don't want to wait for the full cycle (i.e. we ran register(), we exit early here)
                    return Promise(value: ())
                }
                    
                return installEventPromise
            }
            .catch { err in
                
                log.error("Encountered error when installing worker: " + String(describing: err))
                
                // If installation failed, set the worker to redundant
                do {
                    try self.updateWorkerStatuses([UpdateStatusInstruction(id: newWorkerId, newState: ServiceWorkerInstallState.redundant)])
                } catch {
                    // Not much we can do at this point
                    log.error("Also encountered error when trying to update worker to redundant: " + String(describing: error))
                }
                    
            }
            
        }
        
    }
    
    
    func activateServiceWorker(worker: ServiceWorkerInstance, id: Int) -> Promise<Void> {
        
        return Promise(value:())
        .then {
            // Set to activating status before we do anything else
            try self.updateWorkerStatuses([UpdateStatusInstruction(id: id, newState: ServiceWorkerInstallState.activating)])
            
            // Then fire our activate event
            let activateEvent = ActivateEvent()
            
            worker.globalScope.dispatchEvent(activateEvent)
            
            return activateEvent.resolve()
        }
        .then {
            let allWorkers = try self.store.getAllWorkerRecords(forURL: worker.url, withScope: worker.scope)
                .filter { $0.installState != .redundant }
            
            // If we've successfully activated, we now want to set the active worker for this URL
            // to redundant, as well as set this one to active.
            
            var updateInstructions = allWorkers
                .filter { $0.installState == .activated }
                .map { UpdateStatusInstruction(id: $0.id, newState: .redundant) }
            
            updateInstructions.append(UpdateStatusInstruction(id: id, newState: .activated))
            
            try self.updateWorkerStatuses(updateInstructions)
            
            return Promise(value: ())
        }
        .catch { err -> Void in
            log.error("Encountered error when activating worker: " + String(describing: err))
            
            // If activation failed, set the worker to redundant
            do {
                try self.updateWorkerStatuses([UpdateStatusInstruction(id: id, newState: .redundant)])
            } catch {
                // Not much we can do at this point
                log.error("Also encountered error when trying to update worker to redundant: " + String(describing: error))
            }
            
            
        }
        
    }
    
    
    /// We do these in bulk so that we can wrap them all in a transaction - if one fails, they all will.
    func updateWorkerStatuses(_ statuses: [UpdateStatusInstruction]) throws {
        
        try Db.mainDatabase.inTransaction { db in
            
            try statuses.forEach { statusUpdate in
                
                try self.store.updateWorkerState(workerId: statusUpdate.id, newState: statusUpdate.newState, dbTransaction: db)
                
            }
            
        }
        
        // Go through all of our active workers, set statuses accordingly
        
        statuses.forEach { update in
            
            // If this instance is currently active then we need to make sure that
            // any registration using it is updated accordingly
            
            let activeInstance = self.activeServiceWorkers.filter { $0.id == update.id }.first
            
            if activeInstance == nil {
                return
            }
            
            if activeInstance!.instance.installState == update.newState {
                // it hasn't changed
                return
            }
            
            self.dispatchEvent(PendingWorkerStateChangeEvent(worker: activeInstance!.instance, newState: update.newState))
            
            activeInstance!.instance.installState = update.newState
            
        }
        
    }
    
    public func removeAllWorkersFromDatabase() throws {
        self.clearActiveServiceWorkers()
        try Db.mainDatabase.inTransaction { db in
            try db.executeUpdate("DELETE FROM service_workers", values: [])
        }
    }
    
}
