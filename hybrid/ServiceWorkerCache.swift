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

class MappableHTTPHeaderCollection : Mappable {
    
    var headers:[String:String]!
    
    required init?(_ map: Map) {
        
    }
    
    init(headersObj:[NSObject: AnyObject]) {
        self.headers = headersObj as! [String:String]
    }
    
    func mapping(map: Map) {
        headers      <- map["headers"]
    }

}

class ServiceWorkerCacheMatchResponse : Mappable {
    // We don't want to send the whole response directly to the service
    // worker as transferring this blob content into the JSContext, only
    // for it to transfer it straight back to the GCDWebServer is wasteful.
    // instead we just pass back the primary key values we can use with
    // getResponse() later.
    
    var url:String!
    var serviceWorkerURL:String!
    var cacheId:String!
    
    required init?(_ map: Map) {
        
    }
    
    init(url: String, serviceWorkerURL: String, cacheId: String) {
        self.url = url
        self.serviceWorkerURL = serviceWorkerURL
        self.cacheId = cacheId
    }
    
    func mapping(map: Map) {
        url      <- map["url"]
        serviceWorkerURL <- map["serviceWorkerURL"]
        cacheId <- map["cacheId"]
    }
    
}

struct ServiceWorkerCacheResponseData {
    var response: NSData!
    var url: String!
    var headers: [String : String]!
    var status:Int!
}

class CacheOperationNotSupportedError: ErrorType {}
class CacheAddRequestFailedError : ErrorType {}

class ServiceWorkerCache {
    
//    let escapedServiceWorkerURL:String
    let serviceWorkerURL:NSURL
    
    
    init(swURL:NSURL) {
        self.serviceWorkerURL = swURL
//        self.escapedServiceWorkerURL = swURL.absoluteString.stringByAddingPercentEncodingWithAllowedCharacters(NSCharacterSet.alphanumericCharacterSet())!
    }
    
    func hookFunctions(jsContext:JSContext) {
//        let createConnectionConvention: @convention(block) (String) -> Int = self.addAll
//        jsContext.setObject(unsafeBitCast(createConnectionConvention, AnyObject.self), forKeyedSubscript: "__createWebSQLConnection")
    }

    
    func addAll(urls: [String], cacheName:String) -> Promise<Bool> {
        
        // TODO: what about URLs that redirect?
        
        let urlsAsNSURLs = urls.map { (url:String) -> NSURL in
            return NSURL(string: url, relativeToURL: self.serviceWorkerURL)!
        }
        
        return Promise<Void>()
        .thenInBackground({
            // wonder if thenInBackground will help
            
            let downloadAndStoreTasks = urlsAsNSURLs.map { (url: NSURL) -> Promise<AlamofireResponse> in
                return Promisified.AlamofireRequest("GET", url: url)
                    .then { r in
                        
                        if r.response.statusCode < 200 || r.response.statusCode > 299 {
                            log.error("Failed to cache: " + url.absoluteString)
                            throw CacheAddRequestFailedError()
                        }
                        
                        return Promise<AlamofireResponse>(r)
                        
                    }
            }
            
            return when(downloadAndStoreTasks)
                .then { responses in
                    

                    try Db.mainDatabase.inTransaction({ (db) in
                        
                        for r in responses {
                            let headers = MappableHTTPHeaderCollection(headersObj: r.response.allHeaderFields)
    
                            let headersAsJSON = Mapper().toJSONString(headers)!
    
                            try db.executeUpdate("INSERT INTO cache (service_worker_url, cache_id, resource_url, contents, headers, status) VALUES (?,?,?,?,?,?)", values: [self.serviceWorkerURL.absoluteString, cacheName, r.request.URL!.absoluteString, r.data!, headersAsJSON, r.response.statusCode] as [AnyObject])
                        }
    
                    })
                    
                    
                    log.info("Successfully cached: " + urls.joinWithSeparator(", "))
                    return Promise<Bool>(true)
            }

        })
        
    }
    
    func hookFunctions() {
        
    }

    
    func match(url: NSURL, cacheName:String) -> Promise<ServiceWorkerCacheMatchResponse?> {
        
        // match doesn't actually return the response object because sending to the JSContext
        // would be too costly. Instead we map it back again in the web server. That said, means
        // we can't touch/adjust response in JS. Is that a problem?
        
        
        return Promise<Void>()
        .then {
            
            var response:ServiceWorkerCacheMatchResponse? = nil
            
            try Db.mainDatabase.inDatabase { (db) in
                let resultSet = try db.executeQuery("SELECT 1 FROM cache WHERE resource_url = ? AND service_worker_url = ? AND cache_id = ?", values: [url.absoluteString, self.serviceWorkerURL.absoluteString, cacheName])
                
                if resultSet.next() == false {
                    log.info("Could not find cache match for: " + url.absoluteString)
                    return resultSet.close()
                }
                
                response = ServiceWorkerCacheMatchResponse(url: url.absoluteString, serviceWorkerURL: self.serviceWorkerURL.absoluteString, cacheId: cacheName)
                
                log.debug("Found cache match for: " + url.absoluteString)
                
                resultSet.close()
            }
            
            return Promise<ServiceWorkerCacheMatchResponse?>(response)
        }
       
    }
    
    static func getResponse(url:String, serviceWorkerURL:String, cacheName: String) throws -> ServiceWorkerCacheResponseData? {
        
        // Static because this is being called from the web server, which doesn't need
        // or want to care about cache instances.
        
        var response:ServiceWorkerCacheResponseData? = nil
        
        try Db.mainDatabase.inDatabase { (db) in
            let resultSet = try db.executeQuery("SELECT * FROM cache WHERE resource_url = ? AND service_worker_url = ? AND cache_id = ?", values: [url, serviceWorkerURL, cacheName])
            
            if (resultSet.next() == false) {
                // This shouldn't ever happen, but hey, you never know
                return resultSet.close()
            }
            
            let headerCollection = Mapper<MappableHTTPHeaderCollection>().map(resultSet.stringForColumn("headers"))!
            
            response = ServiceWorkerCacheResponseData()
            response!.url = resultSet.stringForColumn("resource_url")
            response!.response = resultSet.dataForColumn("contents")
            response!.headers = headerCollection.headers
            response!.status = Int(resultSet.intForColumn("status"))
            resultSet.close()
        }
        
        return response
    }
    
   
    
}