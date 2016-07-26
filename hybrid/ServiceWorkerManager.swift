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
    
    static private var currentlyActiveServiceWorkers = [Int: ServiceWorkerInstance]()
    
    static private func getOrCreateActiveServiceWorker(instanceId:Int, url:NSURL, scope:NSURL, serviceWorkerJS:String) -> Promise<ServiceWorkerInstance> {
        // If an active instance already exists then we should return that one. Otherwise,
        // create a new instance and store it in the dictionary.
        
        // TODO: When do we evict workers?
        
        if (currentlyActiveServiceWorkers[instanceId] != nil) {
            return Promise<ServiceWorkerInstance>(currentlyActiveServiceWorkers[instanceId]!)
        }
        
        let sw = ServiceWorkerInstance(url: url, scope: scope)
        return sw.loadServiceWorker(serviceWorkerJS)
        .then { _ in
            return sw
        }
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
        
        return Promisified.AlamofireRequest(Alamofire.Method.HEAD, url: url)
            .then({ container in
                let lastModHeader = getHeaderCaseInsensitive(container.response, name: "last-modified")
                
                if (lastModHeader == nil) {
                    return Promise<NSDate?>(nil)
                }
                
                let asDate = HTTPDateToNSDate(lastModHeader!)
                return Promise<NSDate?>(asDate)
            })
    }
    
    
    static func update(urlOfServiceWorker:NSURL, scope:NSURL?) -> Promise<ServiceWorkerUpdateResult> {
        
        enum ServiceWorkerUpdateType {
            case New
            case UpdateExisting
            case DoNotUpdate
        }
        
        return DbTransactionPromise<NSDate?> { db in
            let result = try db.executeQuery("SELECT * FROM service_workers WHERE url = ? ORDER BY last_modified LIMIT 1", values: [urlOfServiceWorker])
            
            if (result.next() == false) {
                
                // If there's no existing service worker record, we must update
                
                return Promise<NSDate?>(nil)
            } else {
                let lastSeenModifiedDate = NSDate(timeIntervalSince1970: result.doubleForColumn("last_modified"))
                return Promise<NSDate?>(lastSeenModifiedDate)
            }

        }.then { (storedLastModDate) -> Promise<ServiceWorkerUpdateType> in
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
            
            return Promisified.AlamofireRequest(Alamofire.Method.GET, url: urlOfServiceWorker)
            .then { container in
                
                let lastMod = getHeaderCaseInsensitive(container.response, name: "last-modified")
                let lastModAsTimeInterval = HTTPDateToNSDate(lastMod!)!.timeIntervalSince1970
                
                let scopeOrNull = scope == nil ? NSNull() : scope!
                
                return DbTransactionPromise<ServiceWorkerUpdateResult> { db in
                    try db.executeUpdate("INSERT INTO service_workers (url, scope, last_modified, contents, install_state) VALUES (?,?,?,?,?)", values: [urlOfServiceWorker, scopeOrNull, lastModAsTimeInterval, container.data!, ServiceWorkerInstallState.Installing.rawValue ] as [AnyObject])
                    
                    let newId = db.lastInsertRowId()
                    
                    // Install happens asyncronously from update call
                    self.install(newId, url: urlOfServiceWorker, scope: scope, js: String(data: container.data!, encoding: NSUTF8StringEncoding)!)
                    
                    let response = updateType == ServiceWorkerUpdateType.UpdateExisting ? ServiceWorkerUpdateResult.UpdatedExisting : ServiceWorkerUpdateResult.New
                    
                    return Promise<ServiceWorkerUpdateResult>(response)
                }
            }
        }
        .recover { err in
            return Promise<ServiceWorkerUpdateResult>(ServiceWorkerUpdateResult.Failed)
        }
    }
    
    static private func install(id:Int64, url:NSURL, scope:NSURL?, js:String) {
        let swInstance = ServiceWorkerInstance(url: url, scope: scope)
        
        
        
        swInstance.loadServiceWorker(js)
        .then { _ in
            return swInstance.dispatchExtendableEvent("install", data: nil)
        }
        .then { _ in
            return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Installed)
        }
        .recover { _ in
            // if installation fails we consider it to be redundant
            return Promise<ServiceWorkerInstallState>(ServiceWorkerInstallState.Redundant)
        }
        .then { installState in
            return DbTransactionPromise<Bool>(toRun: { db in
                try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [NSNumber(longLong: id), installState.rawValue] as [AnyObject])

                // need to revisit DB transactions. Doesn't feel like this is necessary
                return Promise<Bool>(true)
            })
        }
    }
    
    static private func activateServiceWorker(sw:ServiceWorkerInstance, instanceId: Int) -> Promise<Bool> {
        
        return DbTransactionPromise<Void>(toRun: { db in
            try db.executeUpdate("UPDATE service_workers SET install_state = ? WHERE instance_id = ?", values: [ServiceWorkerInstallState.Activating.rawValue, instanceId])
            
            return Promise<Void>()
        })
        .then {
            return sw.dispatchExtendableEvent("activate", data: nil)
        }
        .then { _ in
            return Promise<Bool>(true)
        }
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
    }
    
   
    class InvalidServiceWorkerIDError:ErrorType {}
    class ServiceWorkerActivationFailedError:ErrorType {}
    
    static private func cycleThroughServiceWorkers(allMatchingServiceWorkers: FMResultSet) -> Promise<ServiceWorkerInstance?> {
        
        if (allMatchingServiceWorkers.next() == false) {
            
            // If we're at the end of our result set then we just have to give up.
            
            return Promise<ServiceWorkerInstance?>(nil)
        }
        
        // Otherwise grab that result and try to process it.
        
//        let result = dbResponse.fromDBResultSet(allMatchingServiceWorkers)
        
        let instanceId = Int(allMatchingServiceWorkers.intForColumn("instance_id"))
        
        return ServiceWorkerInstance.getById(instanceId)
            .then { (swMaybe:ServiceWorkerInstance?) -> ServiceWorkerInstance in
                
                if (swMaybe == nil) {
                    throw InvalidServiceWorkerIDError()
                }
                
                let sw = swMaybe!
                
                return Promise<Void>()
                .then { () -> Void in
                    if sw.installState == ServiceWorkerInstallState.Installing {
                        return sw.events.waitFor("install")
                    } else {
                        return Promise<Void>()
                    }
                }.then { () -> Void in
                    if sw.installState == ServiceWorkerInstallState.Installed {
                        return self.activateServiceWorker(sw, instanceId: instanceId)
                    }
                    return Promise<Void>()
                }
                .then {
                    if sw.installState == ServiceWorkerInstallState.Activating {
                        return sw.events.waitFor("activate")
                    }
                    return Promise<Void>()
                }
                

                
            }.then { sw in
        
                if sw.installState == ServiceWorkerInstallState.Installing {
                    return sw.events.waitFor("install")
                }
                
                return Promise<Void>()
                
            }.then {
                
                if sw.installState == ServiceWorkerInstallState.Installed {
                    return self.tryToActivateServiceWorker(sw, instanceId: instanceId)
                }
            }
        
//                
//                if (result.installState == ServiceWorkerInstallState.Installed) {
//                    
//                    // If the SW is installed but not yet activated, try to activate it.
//                    
//                    return self.tryToActivateServiceWorker(sw, instanceId: result.instanceId)
//                } else {
//                    
//                    // Otherwise we're good to go.
//                    
//                    return Promise<Bool>(true)
//                }
            }
            .then { workerIsValid in
                if workerIsValid == true {
                    
                    // So if our worker is already activated, or successfully activated just now
                    // then it's ready to go, return it.
                    
                    return Promise<ServiceWorkerInstance?>(sw)
                } else {
                    
                    // Otherwise it's time to move onto the next service worker.
                    
                    return cycleThroughServiceWorkers(allMatchingServiceWorkers)
                }
        }
        
    }
    
    



    static func getServiceWorkerForURL(url:NSURL) -> Promise<ServiceWorkerInstance?> {
        
        
        return DbTransactionPromise<ServiceWorkerInstance?>(toRun: { db in
            
            // First step is to get the IDs of applicable service workers. We select the most specific
            // scope, then get all matching workers, ordered by recency
            
            let selectScopeQuery = "SELECT scope FROM service_workers WHERE ? LIKE (scope || '%') ORDER BY length(scope) DESC LIMIT 1"
            
            let applicableWorkerResultSet = try db.executeQuery("SELECT instance_id FROM service_workers WHERE scope = (" + selectScopeQuery  + ") AND install_state != ? ORDER BY instance_id DESC", values: [url.absoluteString, ServiceWorkerInstallState.Redundant.rawValue])
            
            return cycleThroughServiceWorkers(applicableWorkerResultSet)
//            
//            var scope: String? = nil
//            
//            if mostSpecificScopeResultSet.next() == false {
//                return Promise<ServiceWorkerInstance?>(nil)
//            }
//            
//            scope = mostSpecificScopeResultSet.stringForColumn("scope")
//            
//            // Now that we have our scope, grab all workers matching that scope, most recent first.
//            
//            let allMatchingServiceWorkers = try db.executeQuery("SELECT url, scope, contents, install_state FROM service_workers WHERE scope = ? AND (install_state = ? OR install_state = ?) ORDER BY instance_id DESC", values: [scope!, ServiceWorkerInstallState.Activated.rawValue, ServiceWorkerInstallState.Installed.rawValue])
//            
//            // Now we're going to cycle over each worker in the result set, and return
//            // the first one that's valid and ready to run.
//            
//            var tryNextServiceWorker: () -> (Promise<ServiceWorkerInstance?>) = {
//                
//                if (allMatchingServiceWorkers.next() == false) {
//                    return Promise<ServiceWorkerInstance?>(nil)
//                }
//                
//                let result = dbResponse.fromDBResultSet(allMatchingServiceWorkers)
//                
//                let sw = ServiceWorkerInstance(url: result.url, scope: result.scope)
//                
//                return sw.loadServiceWorker(result.contents)
//                .then { (_) -> Promise<Bool> in
//                    if (result.installState == ServiceWorkerInstallState.Installed) {
//                        
//                        // If the SW is installed but not yet activated, try to activate it.
//                        
//                        return self.tryToActivateServiceWorker(sw, instanceId: result.instanceId)
//                    } else {
//                        
//                        // Otherwise we're good to go.
//                        
//                        return Promise<Bool>(true)
//                    }
//                }
//                .then { workerIsValid in
//                    if workerIsValid == true {
//                        
//                        // So if our worker is already activated, or successfully activated just now
//                        // then it's ready to go, return it.
//                        
//                        return Promise<ServiceWorkerInstance?>(sw)
//                    } else {
//                        
//                        // Otherwise it's time to move onto the next service worker.
//                        
//                        return tryNextServiceWorker()
//                    }
//                }
//                
//            }
//            
//            return tryNextServiceWorker()
        })
        
        
        }
        
        
        
    }
}