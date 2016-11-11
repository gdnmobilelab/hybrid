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

class CacheOperationNotSupportedError: ErrorType {}
class CacheAddRequestFailedError : ErrorType {}
class CacheNoMatchError : ErrorType {}

@objc protocol ServiceWorkerCacheHandlerExports: JSExport {
    func openCallback(name:String, success: JSValue, failure: JSValue) -> Void
    func keysCallback(success: JSValue, failure: JSValue) -> Void
}

@objc class ServiceWorkerCacheHandler : NSObject, ServiceWorkerCacheHandlerExports {
    
    let worker: ServiceWorkerInstance
    let jsContext: JSContext
    
    init(jsContext: JSContext, serviceWorker: ServiceWorkerInstance) {
        self.jsContext = jsContext
        self.worker = serviceWorker
        
        super.init()
        
        jsContext.setObject(self, forKeyedSubscript: "caches")
        jsContext.setObject(ServiceWorkerCache.self, forKeyedSubscript: "Cache")
        
        
    }
    
    func openCallback(name: String, success: JSValue, failure: JSValue) {
        success.callWithArguments([ServiceWorkerCache(swURL: self.worker.url, swScope: self.worker.scope, name: name)])
    }
    
    func open(name:String) -> ServiceWorkerCache {
        return ServiceWorkerCache(swURL: self.worker.url, swScope: self.worker.scope, name: name)
    }
    
    func keysCallback(success: JSValue, failure: JSValue) {
        do {
            try Db.mainDatabase.inTransaction({ (db) in
                
                let resultSet = try db.executeQuery("SELECT DISTINCT cache_id FROM cache WHERE service_worker_url = ?", values: [self.worker.url.absoluteString!])
                
                var ids: [String] = []
                
                while resultSet.next() {
                    ids.append(resultSet.stringForColumn("cache_id"))
                }
                
                resultSet.close()
                
                success.callWithArguments([JSValue(object: ids, inContext: success.context)])
                
            })
        } catch {
            failure.callWithArguments([JSValue(newErrorFromMessage: String(error), inContext: failure.context)])
        }
    }
}


@objc protocol ServiceWorkerCacheExports : JSExport {
    func addAllCallback(urls:[String], success:JSValue, failure: JSValue) -> Void
    func addCallback(url:String, success:JSValue, failure: JSValue) -> Void
    func matchCallback(url: JSValue, success: JSValue, failure: JSValue) -> Void
}

struct RequestAndResponse {
    var request: FetchRequest
    var response: FetchResponse
}


@objc class ServiceWorkerCache: NSObject, ServiceWorkerCacheExports {
    
    let serviceWorkerURL:NSURL
    let serviceWorkerScope:NSURL
    let name:String
    
    
    init(swURL:NSURL, swScope:NSURL, name:String) {
        self.serviceWorkerURL = swURL
        self.serviceWorkerScope = swScope
        self.name = name
    }
    
    func addCallback(url:String, success: JSValue, failure:JSValue) {
        self.addAllCallback([url], success: success, failure: failure)
    }
    
    func addAllCallback(urls:[String], success:JSValue, failure: JSValue) {
        self.addAll(urls)
        .then { returnBool in
            success.callWithArguments([returnBool])
        }
        .error { err in
            failure.callWithArguments([String(err)])
        }
    }
    
    func addAll(urls: [String]) -> Promise<Bool> {
        
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
                    return Promise<Bool>(true)
            }

        })
        
    }
    
    func matchCallback(request: JSValue, success: JSValue, failure: JSValue) {
        
        var url = ""

        if request.isObject {
            url = (request.toObjectOfClass(FetchRequest) as! FetchRequest).url
        } else {
            url = request.toString()
        }
        
        self.match(NSURL(string: url, relativeToURL: self.serviceWorkerScope)!)
        .then { response in
            success.callWithArguments([response])
        }.error { error in
            failure.callWithArguments([String(error)])
        }
    }
    
    func match(url: NSURL) -> Promise<FetchResponse> {
        
        // match doesn't actually return the response object because sending to the JSContext
        // would be too costly. Instead we map it back again in the web server. That said, means
        // we can't touch/adjust response in JS. Is that a problem?
        
        
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
