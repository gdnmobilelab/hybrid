//
//  FetchRequest.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 21/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

public enum FetchRequestRedirect: String {
    case Follow = "follow"
    case Error = "error"
    case Manual = "manual"
}

public enum FetchRequestCache: String {
    case Default = "default"
    case Reload = "reload"
    case NoCache = "no-cache"
}

public enum FetchRequestMode: String {
    case SameOrigin = "same-origin"
    case NoCORS = "no-cors"
    case CORS = "cors"
}

@objc protocol FetchRequestExports : JSExport {
    var method:String {get}
    
    @objc(url)
    var urlString: String {get}
    
    @objc(referrer)
    var referrerString: String? {get}
    
    @objc(mode)
    var modeString:String {get}
    
    var headers: FetchHeaders? {get}
    var referrerPolicy: String? {get}
    
    
    @objc(redirect)
    var redirectString:String { get }
}

@objc public class FetchRequest: NSObject {
    var method:String = "GET"
    let url: URL
    var headers: FetchHeaders? = nil
    var referrer: URL? = nil
    var referrerPolicy: String? = nil
    var mode:FetchRequestMode = .CORS
    var redirect: FetchRequestRedirect = FetchRequestRedirect.Follow
    var cache: FetchRequestCache = FetchRequestCache.Default
    var body: Data?
    
    internal var origin:URL?
    
    var urlString: String {
        get {
            return self.url.absoluteString
        }
    }
    
    var referrerString:String? {
        get {
            return self.referrer?.absoluteString
        }
    }
    
    var redirectString:String {
        get {
            return self.redirect.rawValue
        }
    }
    
    var modeString:String {
        get {
            return self.mode.rawValue
        }
    }
    
    init(url: URL) {
        self.url = url
        super.init()
    }
    
    /// The Fetch API has various rules regarding the origin of requests. We try to respect
    /// that as best we can.
    internal func enforceOrigin(origin: URL) throws {
        self.origin = origin
        
        if self.mode == .SameOrigin {
            if self.url.scheme != origin.scheme || self.url.host != origin.host {
                throw ErrorMessage("URL is not valid for a same-origin request")
            }
        }
        else if self.mode == .NoCORS {
            if self.method != "HEAD" && self.method != "GET" && self.method != "POST" {
                throw ErrorMessage("Can only send HEAD, GET and POST requests with no-cors requests")
            }
        }
        
    }
    
    internal func applyOptions(opts: [String: AnyObject]) throws {
        
        if let method = opts["method"] as? String {
            self.method = method
        }
        
        if let headers = opts["headers"] as? FetchHeaders {
            self.headers = headers
        } else if let headers = opts["headers"] as? [String: String] {
            
            let headersInstance = FetchHeaders()
            
            for (key, val) in headers {
                headersInstance.append(key, val)
            }
            
            self.headers = headersInstance
            
        }
        
        if let body = opts["body"] as? String {
            if self.method == "GET" || self.method == "HEAD" {
                throw ErrorMessage("Cannot send a body with a \(self.method) request")
            }
            self.body = body.data(using: String.Encoding.utf8)
        } else if opts["body"] != nil {
            throw ErrorMessage("Can only support string request bodies at the moment")
        }
        
        if let mode = opts["mode"] as? String {
            let modeVal = FetchRequestMode(rawValue: mode)
            if modeVal == nil {
                throw ErrorMessage("Did not understand value for attribute 'mode'")
            }
            self.mode = modeVal!
        }
        
        if let cache = opts["cache"] as? String {
            let cacheVal = FetchRequestCache(rawValue: cache)
            if cacheVal == nil {
                throw ErrorMessage("Did not understand value for attribute 'cache'")
            }
            self.cache = cacheVal!
        }
        
        if let redirect = opts["redirect"] as? String {
            
            let redirectVal = FetchRequestRedirect(rawValue: redirect)
            
            if redirectVal == nil {
                throw ErrorMessage("Did not understand value for attribute 'redirect'")
            }
            
            self.redirect = redirectVal!
            
        }
        
    }
}



