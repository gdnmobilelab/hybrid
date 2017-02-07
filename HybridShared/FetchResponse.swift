//
//  FetchResponse.swift
//  hybrid
//
//  Created by alastair.coote on 06/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore


/// A port of the Fetch API's Response object: https://developer.mozilla.org/en-US/docs/Web/API/Response
public class FetchResponse : FetchBody {
    
    public let headers:FetchHeaders
    public var status:Int
    public var statusText:String
    
    public init(body: Data?, status: Int, statusText:String, headers: FetchHeaders) {
        self.status = status
        self.headers = headers
        self.statusText = statusText
        super.init()
        
        self.data = body
    }
    
    
    /// If created without a status, it is assumed the status is 200. This initialiser
    /// matches the JS API
    ///
    /// - Parameters:
    ///   - body: The body for this response
    ///   - options: Options object, containing status, headers, etc
    required public init(body: Any?, options: [String:Any]?) {
        var status = 200
        var statusText = "OK"
        var headers = FetchHeaders()
        
        if let opts = options {
            
            if let statusOpt = opts["status"] as? Int {
                status = statusOpt
            }
            
            if let statusTextOpt = opts["statusText"] as? String {
                statusText = statusTextOpt
            }
            
            if let headersOpt = opts["headers"] as? [String:AnyObject] {
                headers = FetchHeaders(dictionary: headersOpt)
            }
            
        }
        
        self.status = status
        self.statusText = statusText
        self.headers = headers
        
        super.init()
        
        if body != nil {
            
            if let bodyText = body as? String {
                self.data = bodyText.data(using: String.Encoding.utf8)
            } else if let bodyData = body as? Data {
                self.data = bodyData
            } else {
                log.error("Body provided is not a recognised type.")
            }
            
        }
        
    }
    
}
