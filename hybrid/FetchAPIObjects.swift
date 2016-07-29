//
//  FetchAPIObjects.swift
//  hybrid
//
//  Created by alastair.coote on 22/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import ObjectMapper


class FetchRequest : Mappable {
    var url:NSURL!
    var method:String!
    var headers: [String: String]!
    var referrer: NSURL?
    var cache: String!
    
    required init?(_ map: Map) {
        
    }
    
    init() {
        
    }
    
    func mapping(map: Map) {
        url      <- (map["url"], URLTransform())
        method   <- map["method"]
        headers  <- map["headers"]
        referrer <- (map["referrer"], URLTransform())
        cache    <- map["cache"]
    }
}

class FetchResponse : Mappable {
    var url: NSURL!
    var status: Int!
    private var headersAsAnyObject: [String: AnyObject] = [:]
    var _bodyInit: Any!
    var _bodyText: String?
    var type:String!
    var __hybridCacheResponse: ServiceWorkerCacheMatchResponse?
    
    required init?(_ map: Map) {
        
    }

    
    func getHeader(name:String) -> String? {
        // again, remove case-sensitivity in headers
        return self.headersAsAnyObject[name.lowercaseString] as? String
    }
    
    func getBody() -> NSData {
        // Need to build functionality for non-string responses
        return self._bodyText!.dataUsingEncoding(NSUTF8StringEncoding)!
    }
    
    func mapping(map: Map) {
        url         <- (map["url"], URLTransform())
        type        <- map["type"]
        headersAsAnyObject     <- map["headers.map"]
        status      <- map["status"]
        _bodyInit   <- map["_bodyInit"]
        _bodyText   <- map["_bodyText"]
        __hybridCacheResponse <- map["__hybridCacheResponse"]
    }
}
