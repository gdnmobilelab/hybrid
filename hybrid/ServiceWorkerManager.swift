//
//  ServiceWorkerManager.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import ObjectMapper
import Alamofire
import FMDB
import JavaScriptCore

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




class ServiceWorkerManager {
    
    static private var currentlyActiveServiceWorkers = [ServiceWorkerInstance]()
    
    static func clearActiveServiceWorkers() {
        self.currentlyActiveServiceWorkers.removeAll(keepCapacity: false)
    }
    
//    static private func getOrCreateActiveServiceWorker(instanceId:Int) -> Promise<ServiceWorkerInstance> {
//        
//        // If an active instance already exists then we should return that one. Otherwise,
//        // create a new instance and store it in the dictionary.
//        
//        // TODO: When do we evict workers?
//        
//        if (currentlyActiveServiceWorkers[instanceId] != nil) {
//            return Promise<ServiceWorkerInstance>(currentlyActiveServiceWorkers[instanceId]!)
//        }
//        
//        return ServiceWorkerInstance.getById(instanceId)
//        .then { sw in
//            currentlyActiveServiceWorkers[instanceId] = sw!
//            return Promise<ServiceWorkerInstance>(sw!)
//        }
//    
//    }
    
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
        
        return Promisified.AlamofireRequest("HEAD", url: url)
            .then({ container in
                let lastModHeader = getHeaderCaseInsensitive(container.response, name: "last-modified")
                
                if (lastModHeader == nil) {
                    return Promise<NSDate?>(nil)
                }
                
                let asDate = HTTPDateToNSDate(lastModHeader!)
                return Promise<NSDate?>(asDate)
            })
    }
    
    
    static func update(urlOfServiceWorker:NSURL, scope:NSURL) -> Promise<ServiceWorkerUpdateResult> {
        
        enum ServiceWorkerUpdateType {
            case New
            case UpdateExisting
            case DoNotUpdate
        }
        
        return Promise<Void>()
        .then { () -> Promise<NSDate?> in
            
            var lastSeenModifiedDate:NSDate? = nil
            
            try Db.mainDatabase.inDatabase({ (db) in
                let result = try db.executeQuery("SELECT * FROM service_workers WHERE url = ? ORDER BY last_modified LIMIT 1", values: [urlOfServiceWorker])
                
                if result.next() == false {
                    
                    // If there's no existing service worker record, we must update
                    return result.close()
                }
                
                lastSeenModifiedDate = NSDate(timeIntervalSince1970: result.doubleForColumn("last_modified"))
                result.close()
            })
            
            return Promise<NSDate?>(lastSeenModifiedDate)
                
        }

        .then { (storedLastModDate) -> Promise<ServiceWorkerUpdateType> in
            if (storedLastModDate == nil) {
                // if we have no stored date, we need to update
                return Promise<ServiceWorkerUpdateType>(ServiceWorkerUpdateType.New)
            }
            
            // if we do have one, do a HEAD request to get the new last modified date
            return getLastUpdated(urlOfServiceWorker)
            .then { lastMod in
                
                // Otherwise, we do a date comparison between the header and result to see if we need to update
                
                if lastMod!.compare(storedLastModDate!) == NSComparisonResult.OrderedDescending {
                    return Promise<ServiceWorkerUpdateType>(ServiceWorkerUpdateType.UpdateExisting)
                } else {
                    return Promise<ServiceWorkerUpdateType>(ServiceWorkerUpdateType.DoNotUpdate)
                }
            }
        }.then { (updateType) -> Promise<ServiceWorkerUpdateResult> in
                
 
            if (updateType == ServiceWorkerUpdateType.DoNotUpdate) {
                return Promise<ServiceWorkerUpdateResult>(ServiceWorkerUpdateResult.NoUpdateNeeded)
            }
            
            return Promisified.AlamofireRequest("GET", url: urlOfServiceWorker)
            .then { container in
                
                let lastMod = getHeaderCaseInsensitive(container.response, name: "last-modified")
                let lastModAsTimeInterval = HTTPDateToNSDate(lastMod!)!.timeIntervalSince1970
                
                return self.insertServiceWorkerIntoDB(
                    urlOfServiceWorker,
                    scope: scope,
                    lastModified: lastModAsTimeInterval,
                    js: container.data!
                ).then { id in
                    let response = updateType == ServiceWorkerUpdateType.UpdateExisting ? ServiceWorkerUpdateResult.UpdatedExisting : ServiceWorkerUpdateResult.New
                    
                    // Install happens asyncronously from update call
                    self.installServiceWorker(id)
                    
                    return Promise<ServiceWorkerUpdateResult>(response)

                }
                
            }
        }
        .recover { err in
            return Promise<ServiceWorkerUpdateResult>(ServiceWorkerUpdateResult.Failed)
        }
    }
    
    static func insertServiceWorkerIntoDB(serviceWorkerURL:NSURL, scope: NSURL, lastModified:NSTimeInterval, js:NSData, installState:ServiceWorkerInstallState = ServiceWorkerInstallState.Installing) -> Promise<Int> {
        
        return Promise<Void>()
        .then {
            
            var newId:Int64 = -1
            
            try Db.mainDatabase.inTransaction({ (db) in
                try db.executeUpdate("INSERT INTO service_workers (url, scope, last_modified, contents, install_state) VALUES (?,?,?,?,?)", values: [serviceWorkerURL.absoluteString, scope.absoluteString, lastModified, js, installState.rawValue ] as [AnyObject])
                
                newId = db.lastInsertRowId()
            })
            
            log.info("Installed service worker for URL: " + serviceWorkerURL.absoluteString)
            
            return Promise<Int>(Int(newId))
        }
       
    }
    
    static func installServiceWorker(id:Int) -> Promise<ServiceWorkerInstallState> {
        
        // Service workers run "install" events, and if successful, "activate" events.
        // If either of these fail, it's considered redundant and invalid. So that's
        // what we'll do!
        
        return ServiceWorkerInstance.getById(id)
        .then { (swInstance) -> Promise<ServiceWorkerInstallState> in
            return swInstance!.dispatchExtendableEvent("install", data: nil)
            .then { (_) -> Promise<ServiceWorkerInstallState> in
                
                // Service workers can call self.skipWaiting() on install, meaning that they are
                // activated instantly.
                
                let waitSkipped = swInstance!.executeJS("hybrid.__getSkippedWaitingStatus()").toBool()
                
                if waitSkipped == true {
                    return swInstance!.dispatchExtendableEvent("activate", data: nil)
                    .then { _ in
                        
                        // Also remove any currently running service workers from our cache
                        
                        for var x = self.currentlyActiveServiceWorkers.count - 1; x > -1; x = x - 1 {
                            if self.currentlyActiveServiceWorkers[x].url == swInstance?.url {
                                self.currentlyActiveServiceWorkers.removeAtIndex(x)
                            }
                        }
                        
                        
                        return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Activated)
                    }
                }
                
                return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Installed)
    
            }
            .recover { error in
                
                // If an error occurred in either the installation or optional activation step,
                // mark the worker as redundant.
                
                return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Redundant)
            }
            .then { installState in
                
                
                try Db.mainDatabase.inTransaction({ (db) in
                    let idAsNSNumber = NSNumber(longLong: Int64(id))
                    
                    // Update our service worker to be "current"
                    
                    try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [installState.rawValue, idAsNSNumber] as [AnyObject])
                    
                    // Now set all other workers for this scope to "redundant"
                    // TODO: cleanup. Just delete the rows?
                    
                    try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE scope = ? AND instance_id != ?", values: [ServiceWorkerInstallState.Redundant.rawValue, swInstance!.scope.absoluteString, idAsNSNumber] as [AnyObject])

                })
                
                return Promise<ServiceWorkerInstallState>(installState)
                
            }
        }
        
    }
    
//    static private func tryToActivateServiceWorker(sw:ServiceWorkerInstance, instanceId: Int) -> Promise<Bool> {
//        
//        return DbTransactionPromise<Void>(toRun: { db in
//            try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [ServiceWorkerInstallState.Activating.rawValue, instanceId])
//            
//            return Promise<Void>()
//        })
//        .then {
//            return sw.dispatchExtendableEvent("activate", data: nil)
//        }
//        .then { _ in
//            return Promise<Bool>(true)
//        }
//        .recover({ (error:ErrorType) -> Promise<Bool> in
//            log.error("Could not activate service worker: " + String(error))
//            return Promise<Bool>(false)
//        })
//        .then { activationSuccess in
//            
//            let newStatus = activationSuccess == true ? ServiceWorkerInstallState.Activated : ServiceWorkerInstallState.Redundant
//            
//            return DbTransactionPromise<Bool>(toRun: { db in
//                try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [newStatus.rawValue, instanceId])
//                
//                return Promise<Bool>(activationSuccess)
//            })
//
//        }
//    }
    
    static private func attemptWorkerActivate(sw:ServiceWorkerInstance, instanceId:Int) -> Promise<Void> {
        
        return sw.dispatchExtendableEvent("activate", data: nil)
        .then { _ -> ServiceWorkerInstallState in
            log.info("Successfully activated service worker: " + sw.url.absoluteString)
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
        
        for sw in self.currentlyActiveServiceWorkers {
            
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
                
                let selectScopeQuery = "SELECT scope FROM service_workers WHERE ? LIKE (scope || '%') ORDER BY length(scope) DESC LIMIT 1"
                
                let applicableWorkerResultSet = try db.executeQuery("SELECT instance_id FROM service_workers WHERE scope = (" + selectScopeQuery  + ") AND (install_state == ? OR install_state = ?) ORDER BY instance_id DESC", values: [url.absoluteString, ServiceWorkerInstallState.Activated.rawValue, ServiceWorkerInstallState.Installed.rawValue])
               
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
                if (eligibleWorker != nil) {
                    self.currentlyActiveServiceWorkers.append(eligibleWorker!)
                }
                return Promise<ServiceWorkerInstance?>(eligibleWorker)
            }
        }
        
        
        }
        
        
        
    }
