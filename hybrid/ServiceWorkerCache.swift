//
//  ServiceWorkerCache.swift
//  hybrid
//
//  Created by alastair.coote on 28/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import FMDB
import JavaScriptCore


/// If a URL to be cached returns a non-200 status code, we throw an error.
class CacheAddRequestFailedError : ErrorType {}

/// When Cache.match() fails it throws an error rather than return a null response.
class CacheNoMatchError : ErrorType {}

@objc protocol ServiceWorkerCacheExports : JSExport {
    func addAll(urls:[String]) -> JSPromise
    func add(url:String) -> JSPromise
    func match(url: JSValue) -> JSPromise
}

struct RequestAndResponse {
    var request: FetchRequest
    var response: FetchResponse
}


/// An implementation of the Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache
@objc class ServiceWorkerCache: NSObject, ServiceWorkerCacheExports {
    
    let serviceWorkerURL:NSURL
    let serviceWorkerScope:NSURL
    let name:String
    
    
    init(swURL:NSURL, swScope:NSURL, name:String) {
        self.serviceWorkerURL = swURL
        self.serviceWorkerScope = swScope
        self.name = name
    }
    
    
    /// Since the only difference between add and addAll is that addAll takes an array,
    /// we just immediately pass this to addAll with a single value array.
    func add(url:String) -> JSPromise {
        return self.addAll([url])
    }
    
    
    /// Add all of the provided URLs to the cache.
    ///
    /// - Parameters:
    ///   - urls: An array of URLs as strings
    func addAll(urls:[String]) -> JSPromise {
        return PromiseToJSPromise<Void>.pass(self._addAll(urls))
    }
    
    
    /// Take an array of URLs, download them, and store them in our FDMB instance.
    ///
    /// - Parameter urls: An array of URLs, in string form. Resolved to service worker scope if they are relative URLs.
    /// - Returns: A Promise that resolves when the operation has completed (or throws if it doesn't work)
    private func _addAll(urls: [String]) -> Promise<Void> {
        
        // TODO: what about URLs that redirect?
        
        let urlsAsNSURLs = urls.map { (url:String) -> NSURL in
            return NSURL(string: url, relativeToURL: self.serviceWorkerScope)!
        }
        
        return Promise<Void>()
        .then({
            
            let downloadAndStoreTasks = urlsAsNSURLs.map { (url: NSURL) -> Promise<RequestAndResponse> in
                
                let fetchRequest = FetchRequest(url: url.absoluteString!, options: nil)
                
                return GlobalFetch.fetchRequest(fetchRequest)
                .then { response in
                    
                    if response.status < 200 || response.status > 299 {
                        log.error("Failed to cache: " + url.absoluteString!)
                        throw CacheAddRequestFailedError()
                    }
                    
                    return Promise<RequestAndResponse>(RequestAndResponse(request: fetchRequest, response: response))
                    
                }
            }
            
            return when(downloadAndStoreTasks)
                .then { reqResponsePairs in
                    

                    try Db.mainDatabase.inTransaction({ (db) in
                        
                        for r in reqResponsePairs {
                            
                            
                            let headersAsJSON = try r.response.headers.toJSON()
                            
                            // It's valid to overwrite an existing cache entry. So, let's make sure we've deleted any existing ones
                            
                            try db.executeUpdate("DELETE FROM cache WHERE service_worker_url = ? AND cache_id = ? AND resource_url = ?", values: [self.serviceWorkerURL.absoluteString!, self.name, r.request.url])
                            
                            try db.executeUpdate("INSERT INTO cache (service_worker_url, cache_id, resource_url, contents, headers, status) VALUES (?,?,?,?,?,?)", values: [self.serviceWorkerURL.absoluteString!, self.name, r.request.url, r.response.data!, headersAsJSON, r.response.status] as [AnyObject])
                        }
    
                    })
                    
                    log.info("Successfully cached: " + urls.joinWithSeparator(", "))
                    return Promise<Void>()
            }

        })
        
    }
    
    
    /// Query the database to see if we have a match for the URL provided, within this cache's ID.
    ///
    /// - Parameters:
    ///   - request: Either an instance of FetchRequest or a string URL.
    func match(request: JSValue) -> JSPromise {
        
        var url = ""

        if request.isObject {
            url = (request.toObjectOfClass(FetchRequest) as! FetchRequest).url
        } else {
            url = request.toString()
        }
        
        return PromiseToJSPromise.pass(self._match(NSURL(string: url, relativeToURL: self.serviceWorkerScope)!))
       
    }
    
    
    /// Query the database to see if we have a match for the URL provided, within this cache's ID.
    ///
    /// - Parameter url: The URL to try to match
    /// - Returns: A promise that resolves to a FetchResponse, or throws an error if one is not found
    func _match(url: NSURL) -> Promise<FetchResponse> {
        
        return Promise<Void>()
        .then {
            
            var response:FetchResponse? = nil
            
            try Db.mainDatabase.inDatabase { (db) in
                let resultSet = try db.executeQuery("SELECT * FROM cache WHERE resource_url = ? AND service_worker_url = ? AND cache_id = ?", values: [url.absoluteString!, self.serviceWorkerURL.absoluteString!, self.name])
                
                if resultSet.next() == false {
                    log.info("Could not find cache match for: " + url.absoluteString!)
                    return resultSet.close()
                }
                
                
                let fh = try FetchHeaders.fromJSON(resultSet.stringForColumn("headers"))
                
                let opts: [String: AnyObject] = [
                    "status": Int(resultSet.intForColumn("status")),
                    "headers": fh
                ]
                
                
                response = FetchResponse(body: resultSet.dataForColumn(("contents")), options: opts)
                
                
                log.debug("Found cache match for: " + url.absoluteString!)
                
                resultSet.close()
            }
            
            if response == nil {
                throw CacheNoMatchError()
            }
            
            return Promise<FetchResponse>(response!)
        }
       
    }
   
    
}
