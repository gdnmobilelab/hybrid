////
////  FetchAPIObjects.swift
////  hybrid
////
////  Created by alastair.coote on 22/07/2016.
////  Copyright © 2016 Alastair Coote. All rights reserved.
////
//
//import Foundation
//import ObjectMapper
//
//
//class OldFetchRequest : Mappable {
//    var url:NSURL!
//    var method:String!
//    var headers: [String: String]!
//    var referrer: NSURL?
//    var cache: String!
//    
//    required init?(_ map: Map) {
//        
//    }
//    
//    init() {
//        
//    }
//    
//    func mapping(map: Map) {
//        url      <- (map["url"], URLTransform())
//        method   <- map["method"]
//        headers  <- map["headers"]
//        referrer <- (map["referrer"], URLTransform())
//        cache    <- map["cache"]
//    }
//}
//
//class FetchHasNoBodyError: ErrorType {}
//
//class OldFetchResponse : Mappable {
//    var url: NSURL!
//    var status: Int?
//    private var headersAsAnyObject: [String: AnyObject] = [:]
//    var _bodyInit: Any!
//    var _bodyText: String?
//    var type:String!
//    private var hybridCacheResponse: ServiceWorkerCacheMatchResponse?
//    
//    required init?(_ map: Map) {
//        
//    }
//    
//    func checkForCacheMatchResponse() throws {
//        
//        if self.hybridCacheResponse == nil {
//            return
//        }
//        
//        let cacheResponse = try ServiceWorkerCache.getResponse(self.url.absoluteString, serviceWorkerURL: hybridCacheResponse!.serviceWorkerURL, cacheName: hybridCacheResponse!.cacheId)!
//        
//        self._bodyInit = cacheResponse.response
//        self.headersAsAnyObject = cacheResponse.headers
////        self.stat
//    }
//
//    
//    func getHeader(name:String) -> String? {
//        // again, remove case-sensitivity in headers
//        let header = self.headersAsAnyObject[name.lowercaseString]
//        if header == nil {
//            return nil
//        }
//        
//        // The Fetch JS library returns headers as an array. Not 100% sure why - need to 
//        // make sure commas are the correct way to bring these together.
//        
//        return (header as! NSArray).componentsJoinedByString(",")
//    }
//    
//    func getAllHeaders() -> [String: AnyObject] {
//        
//        let headersAsArray = self.headersAsAnyObject as! [String: NSArray]
//        var headersAsString = [String:String]()
//        
//        for (key, val) in headersAsArray {
//            headersAsString[key] = val.componentsJoinedByString(",")
//        }
//        return headersAsString
//    }
//    
//    func getBody() throws -> NSData {
//        
//        if self._bodyText != nil {
//            return self._bodyText!.dataUsingEncoding(NSUTF8StringEncoding)!
//        }
//        
//        if self._bodyInit == nil {
//            throw FetchHasNoBodyError()
//        }
//        
//        // TODO: What if this isn't NSData? Right now it always is, but that could change.
//        return self._bodyInit as! NSData
//    
//    }
//    
//    func mapping(map: Map) {
//        url         <- (map["url"], URLTransform())
//        type        <- map["type"]
//        headersAsAnyObject     <- map["headers.map"]
//        status      <- map["status"]
//        _bodyInit   <- map["_bodyInit"]
//        _bodyText   <- map["_bodyText"]
//        hybridCacheResponse <- map["__hybridCacheResponse"]
//    }
//}
