//
//  ServiceWorkerCacheStorage.swift
//  hybrid
//
//  Created by alastair.coote on 17/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit

@objc protocol ServiceWorkerCacheStorageExports: JSExport {
    func open(name:String) -> JSPromise
    func keys() -> JSPromise
    func match(request:JSValue) -> JSPromise
    func delete(name:String) -> JSPromise
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
    
    func _open(name:String) -> ServiceWorkerCache {
        return ServiceWorkerCache(swURL: self.worker.url, swScope: self.worker.scope, name: name)
    }
    
    
    /// Create a new ServiceWorkerCache instance with the specified name. 
    ///
    /// - Parameters:
    ///   - name: The name to use
    func open(name: String) -> JSPromise {
        return JSPromise.resolve(_open(name))
    }
    
    func _keys() -> Promise<[String]> {
        
        return Promise<[String]> { fulfill, reject in
            do {
                try Db.mainDatabase.inTransaction({ (db) in
                    
                    let resultSet = try db.executeQuery("SELECT DISTINCT cache_id FROM cache WHERE service_worker_url = ?", values: [self.worker.url.absoluteString!])
                    
                    var ids: [String] = []
                    
                    while resultSet.next() {
                        ids.append(resultSet.stringForColumn("cache_id"))
                    }
                    
                    resultSet.close()
                    
                    fulfill(ids)
                    
                })
            } catch {
                reject(error)
            }

        }
        
    }
    
    /// Get the keys of all the caches in the database. Didn't notice this when first implementing, so we have to do a custom
    /// SQL query to get distinct keys. Not sure there's really a huge performance issue though.
    func keys() -> JSPromise {
        
        // The Swift compiler doesn't like us passing in a Promise<[String]> for reasons
        // I don't quite understand. But for now we'll just cast to AnyObject to make it happy.
        
        let promise = _keys().then { keys in
            return keys as [AnyObject]
        }
        
        return PromiseToJSPromise.pass(promise)

    }
    
    func _match(url: NSURL) -> Promise<FetchResponse> {
        // Can't find anything in the spec to decide what order we do this in. So we'll just do it in whatever order they come.

        return _keys()
        .then { allKeys in
            
            // Now we have all of our keys, we go through each one by one to see if it has a response
            
            let tryIndex = { (idx:Int) -> Promise<FetchResponse> in
                let cache = self._open(allKeys[idx])
                return cache._match(url)
            }
            
            var currentIndex = 0
            
            return tryIndex(currentIndex)
            .recover { error -> Promise<FetchResponse> in
                currentIndex = currentIndex + 1
                if currentIndex == allKeys.count {
                    // Nothing left to try
                    throw error
                }
                return tryIndex(currentIndex)
            }
            
        }
        
    }
    
    func match(request:JSValue) -> JSPromise {
        var url = ""
        
        if request.isObject {
            url = (request.toObjectOfClass(FetchRequest) as! FetchRequest).url
        } else {
            url = request.toString()
        }
        
        let urlAsNSURL = NSURL(string: url, relativeToURL: self.worker.scope)!
        
        return PromiseToJSPromise.pass(_match(urlAsNSURL))

    }
    
    func _delete(name:String) -> Promise<Bool> {
        return Promise<Void>()
        .then { () -> Bool in
            
            var cacheExisted:Bool = false
            
            try Db.mainDatabase.inTransaction({ db in
                
                let queryArguments = [self.worker.url.absoluteString!, name]
                
                let numRowsQuery = try db.executeQuery("SELECT COUNT(*) FROM cache WHERE service_worker_url = ? and cache_id = ?", values: queryArguments)
                
                numRowsQuery.next()
               
                cacheExisted = numRowsQuery.intForColumnIndex(0) > 0
                
                numRowsQuery.close()
                
                if cacheExisted {
                    try db.executeUpdate("DELETE FROM cache WHERE service_worker_url = ? AND cache_id = ?", values: queryArguments)
                    log.info("Deleted cache '" + name + "'")
                } else {
                    log.info("Tried to delete cache '" + name + "' but it didn't exist")
                }
                
            })
            
            return cacheExisted
        }
    }
    
    func delete(name:String) -> JSPromise {
        return PromiseToJSPromise<Bool>.pass(_delete(name))
    }
}
