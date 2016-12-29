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
class CacheAddRequestFailedError : Error {}

/// When Cache.match() fails it throws an error rather than return a null response.
class CacheNoMatchError : Error {}

@objc protocol ServiceWorkerCacheExports : JSExport {
    func addAll(_ urls:[String]) -> JSPromise
    func add(_ url:String) -> JSPromise
    func match(_ url: JSValue) -> JSPromise
}

struct RequestAndResponse {
    var request: FetchRequest
    var response: FetchResponse
}


/// An implementation of the Cache API: https://developer.mozilla.org/en-US/docs/Web/API/Cache
@objc class ServiceWorkerCache: NSObject, ServiceWorkerCacheExports {
    
    let serviceWorkerURL:URL
    let serviceWorkerScope:URL
    let name:String
    
    
    init(swURL:URL, swScope:URL, name:String) {
        self.serviceWorkerURL = swURL
        self.serviceWorkerScope = swScope
        self.name = name
    }
    
    
    /// Since the only difference between add and addAll is that addAll takes an array,
    /// we just immediately pass this to addAll with a single value array.
    func add(_ url:String) -> JSPromise {
        return self.addAll([url])
    }
    
    
    /// Add all of the provided URLs to the cache.
    ///
    /// - Parameters:
    ///   - urls: An array of URLs as strings
    func addAll(_ urls:[String]) -> JSPromise {
        return PromiseToJSPromise<Void>.pass(self._addAll(urls))
    }
    
    
    /// Take an array of URLs, download them, and store them in our FDMB instance.
    ///
    /// - Parameter urls: An array of URLs, in string form. Resolved to service worker scope if they are relative URLs.
    /// - Returns: A Promise that resolves when the operation has completed (or throws if it doesn't work)
    fileprivate func _addAll(_ urls: [String]) -> Promise<Void> {
        
        // TODO: what about URLs that redirect?
        
        let urlsAsNSURLs = urls.map { (url:String) -> URL in
            return URL(string: url, relativeTo: self.serviceWorkerScope)!
        }
        
        return Promise(value: ())
        .then {
            
            let downloadAndStoreTasks = urlsAsNSURLs.map { (url: URL) -> Promise<RequestAndResponse> in
                
                let fetchRequest = FetchRequest(url: url.absoluteString, options: nil)
                
                return GlobalFetch.fetchRequest(fetchRequest)
                .then { response in
                    
                    if response.status < 200 || response.status > 299 {
                        log.error("Failed to cache: " + url.absoluteString)
                        throw CacheAddRequestFailedError()
                    }
                    
                    return Promise(value: RequestAndResponse(request: fetchRequest, response: response))
                    
                }
            }
            
            return when(fulfilled: downloadAndStoreTasks)
            .then { reqResponsePairs in
                

                try Db.mainDatabase.inTransaction({ (db) in
                    
                    for r in reqResponsePairs {
                        
                        
                        let headersAsJSON = try r.response.headers.toJSON()
                        
                        // It's valid to overwrite an existing cache entry. So, let's make sure we've deleted any existing ones
                        
                        try db.executeUpdate("DELETE FROM cache WHERE service_worker_url = ? AND cache_id = ? AND resource_url = ?", values: [self.serviceWorkerURL.absoluteString, self.name, r.request.url])
                        
                        try db.executeUpdate("INSERT INTO cache (service_worker_url, cache_id, resource_url, contents, headers, status) VALUES (?,?,?,?,?,?)", values: [self.serviceWorkerURL.absoluteString, self.name, r.request.url, r.response.data!, headersAsJSON, r.response.status])
                    }

                })
                
                log.info("Successfully cached: " + urls.joined(separator: ", "))
                return Promise(value: ())
            }

        }
        
    }
    
    
    /// Query the database to see if we have a match for the URL provided, within this cache's ID.
    ///
    /// - Parameters:
    ///   - request: Either an instance of FetchRequest or a string URL.
    func match(_ request: JSValue) -> JSPromise {
        
        var url = ""

        if request.isObject {
            url = (request.toObjectOf(FetchRequest.self) as! FetchRequest).url
        } else {
            url = request.toString()
        }
        
        return PromiseToJSPromise.pass(self._match(URL(string: url, relativeTo: self.serviceWorkerScope)!))
       
    }
    
    
    /// Query the database to see if we have a match for the URL provided, within this cache's ID.
    ///
    /// - Parameter url: The URL to try to match
    /// - Returns: A promise that resolves to a FetchResponse, or throws an error if one is not found
    func _match(_ url: URL) -> Promise<FetchResponse> {
        
        return Promise(value: ())
        .then {
            
            var response:FetchResponse? = nil
            
            try Db.mainDatabase.inDatabase { (db) in
                let resultSet = try db.executeQuery("SELECT * FROM cache WHERE resource_url = ? AND service_worker_url = ? AND cache_id = ?", values: [url.absoluteString, self.serviceWorkerURL.absoluteString, self.name])
                
                if resultSet.next() == false {
                    log.info("Could not find cache match for: " + url.absoluteString)
                    return resultSet.close()
                }
                
                
                let fh = try FetchHeaders.fromJSON(resultSet.string(forColumn: "headers"))
                
                let opts: [String: Any] = [
                    "status": Int(resultSet.int(forColumn: "status")),
                    "headers": fh
                ]
                
                
                response = FetchResponse(body: resultSet.data(forColumn: ("contents")), options: opts)
                
                
                log.debug("Found cache match for: " + url.absoluteString)
                
                resultSet.close()
            }
            
            if response == nil {
                throw CacheNoMatchError()
            }
            
            return Promise(value: response!)
        }
       
    }
   
    
}
