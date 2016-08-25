//
//  ServiceWorkerCache.swift
//  hybrid
//
//  Created by alastair.coote on 28/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Alamofire
import PromiseKit
import ObjectMapper
import FMDB
import JavaScriptCore

class CacheOperationNotSupportedError: ErrorType {}
class CacheAddRequestFailedError : ErrorType {}
class CacheNoMatchError : ErrorType {}

@objc protocol ServiceWorkerCacheHandlerExports: JSExport {
    func openCallback(name:String, success: JSValue, failure: JSValue) -> Void
}

@objc class ServiceWorkerCacheHandler : NSObject, ServiceWorkerCacheHandlerExports {
    
    let swURL: NSURL
    let jsContext: JSContext
    
    init(jsContext: JSContext, serviceWorkerURL: NSURL) {
        self.jsContext = jsContext
        self.swURL = serviceWorkerURL
        
        super.init()
        
        jsContext.setObject(self, forKeyedSubscript: "caches")
        jsContext.setObject(ServiceWorkerCache.self, forKeyedSubscript: "Cache")
        
        
    }
    
    func openCallback(name: String, success: JSValue, failure: JSValue) {
        success.callWithArguments([ServiceWorkerCache(swURL: self.swURL, name: name)])
    }
    
    func open(name:String) -> ServiceWorkerCache {
        return ServiceWorkerCache(swURL: self.swURL, name: name)
    }
}


@objc protocol ServiceWorkerCacheExports : JSExport {
    func addAllCallback(urls:[String], success:JSValue, failure: JSValue) -> Void
    func addCallback(url:String, success:JSValue, failure: JSValue) -> Void
    func matchCallback(url: String, success: JSValue, failure: JSValue) -> Void
}


@objc class ServiceWorkerCache: NSObject, ServiceWorkerCacheExports {
    
    let serviceWorkerURL:NSURL
    let name:String
    
    
    init(swURL:NSURL, name:String) {
        self.serviceWorkerURL = swURL
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
            return NSURL(string: url, relativeToURL: self.serviceWorkerURL)!
        }
        
        return Promise<Void>()
        .then({
            
            let downloadAndStoreTasks = urlsAsNSURLs.map { (url: NSURL) -> Promise<AlamofireResponse> in
                return Promisified.AlamofireRequest("GET", url: url)
                    .then { r in
                        
                        if r.response.statusCode < 200 || r.response.statusCode > 299 {
                            log.error("Failed to cache: " + url.absoluteString!)
                            throw CacheAddRequestFailedError()
                        }
                        
                        return Promise<AlamofireResponse>(r)
                        
                    }
            }
            
            return when(downloadAndStoreTasks)
                .then { responses in
                    

                    try Db.mainDatabase.inTransaction({ (db) in
                        
                        for r in responses {
                            
                            let fh = FetchHeaders(dictionary: r.response.allHeaderFields as! [String: AnyObject])
                            
                            let headersAsJSON = try fh.toJSON()
    
                            try db.executeUpdate("INSERT INTO cache (service_worker_url, cache_id, resource_url, contents, headers, status) VALUES (?,?,?,?,?,?)", values: [self.serviceWorkerURL.absoluteString!, self.name, r.request.URL!.absoluteString!, r.data!, headersAsJSON, r.response.statusCode] as [AnyObject])
                        }
    
                    })
                    
                    
                    log.info("Successfully cached: " + urls.joinWithSeparator(", "))
                    return Promise<Bool>(true)
            }

        })
        
    }
    
    func matchCallback(url: String, success: JSValue, failure: JSValue) {
        self.match(NSURL(string: url)!)
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
