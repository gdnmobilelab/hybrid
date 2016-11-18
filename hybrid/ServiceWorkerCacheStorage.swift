//
//  ServiceWorkerCacheStorage.swift
//  hybrid
//
//  Created by alastair.coote on 17/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol ServiceWorkerCacheStorageExports: JSExport {
    func open(name:String) -> JSPromise
    func keys() -> JSPromise
}


/// Implemention of the Cache API: https://developer.mozilla.org/en-US/docs/Web/API/CacheStorage using
/// callbacks instead of promises. We wrap in promises on the js-src side - might be possible to
/// directly use promises here, but I'm yet to work out how.
@objc class ServiceWorkerCacheStorage : NSObject, ServiceWorkerCacheStorageExports {
    
    /// The instance this cache handler is attached to
    let worker: ServiceWorkerInstance
    
    init(serviceWorker: ServiceWorkerInstance) {
        self.worker = serviceWorker
        
        super.init()
        
        // Set the global caches object
        self.worker.jsContext.setObject(self, forKeyedSubscript: "caches")
        "".uppercaseString
        // And set the class variable
        self.worker.jsContext.setObject(ServiceWorkerCache.self, forKeyedSubscript: "Cache")
        
    }
    
    
    /// Create a new ServiceWorkerCache instance with the specified name. 
    ///
    /// - Parameters:
    ///   - name: The name to use
    func open(name: String) -> JSPromise {
        return JSPromise.resolve(ServiceWorkerCache(swURL: self.worker.url, swScope: self.worker.scope, name: name))
    }
    
    
    /// Get the keys of all the caches in the database. Didn't notice this when first implementing, so we have to do a custom
    /// SQL query to get distinct keys. Not sure there's really a huge performance issue though.
    func keys() -> JSPromise {
       
        let promise = JSPromise()
        
        do {
            try Db.mainDatabase.inTransaction({ (db) in
                
                let resultSet = try db.executeQuery("SELECT DISTINCT cache_id FROM cache WHERE service_worker_url = ?", values: [self.worker.url.absoluteString!])
                
                var ids: [String] = []
                
                while resultSet.next() {
                    ids.append(resultSet.stringForColumn("cache_id"))
                }
                
                resultSet.close()
                
                promise.resolve(ids)
                
            })
        } catch {
            promise.reject(error)
        }
        
        return promise
    }
}
