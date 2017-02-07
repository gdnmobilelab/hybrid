//
//  FetchRequest.swift
//  hybrid
//
//  Created by alastair.coote on 06/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

/// A port of the Fetch APIs Request object: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
public class FetchRequest : FetchBody {
    
    public var url:String
    var method:String
    var headers:FetchHeaders
    
    required public init(url:String, options: [String: Any]?)  {
        self.url = url
        
        var data:Data? = nil
        
        if let opts = options {
            if let method = opts["method"] as? String {
                self.method = method
            } else {
                self.method = "GET"
            }
            
            // Headers can be an instance of FetchHeaders or a simple JS object.
            
            if let headers = opts["headers"] as? [String: AnyObject] {
                self.headers = FetchHeaders(dictionary: headers)
            } else if let headers = opts["headers"] as? FetchHeaders {
                self.headers = headers
            } else {
                self.headers = FetchHeaders()
            }
            
            if let body = opts["body"] as? String {
                data = body.data(using: String.Encoding.utf8)
            }
            
            
        } else {
            self.method = "GET"
            self.headers = FetchHeaders()
        }
        
        super.init()
        if data != nil {
            self.data = data!
        }
    }
    
    public var referrer:String? {
        get {
            return self.headers.get("referrer")
        }
    }
    
    
    /// Helper function to transform this request internally into an NSURLRequest, to allow
    /// us to actually run the fetch operation
    ///
    /// - Returns: an NSURLRequest object populated with the info contained in this FetchRequest
    public func toNSURLRequest() -> URLRequest {
        
        let request = NSMutableURLRequest(url: URL(string: self.url)!)
        request.httpMethod = self.method
        
        for key in self.headers.keys() {
            let allValsJoined = self.headers.getAll(key)?.joined(separator: ",")
            request.setValue(allValsJoined, forHTTPHeaderField: key)
        }
        
        if self.data != nil {
            request.httpBody = self.data
        }
        
        
        return request as URLRequest
    }
}
