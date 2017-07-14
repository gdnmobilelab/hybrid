//
//  FetchResponse.swift
//  ServiceWorker
//
//  Created by alastair.coote on 13/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared

@objc public class FetchResponse : NSObject, URLSessionDataDelegate {
    
    fileprivate let fetchOperation: FetchOperation
    fileprivate var responseCallback: ((URLSession.ResponseDisposition) -> Void)?
    fileprivate let httpResponse:HTTPURLResponse
    let headers:FetchHeaders
    var bodyUsed:Bool = false
    
    @objc var url:String? {
        get {
            return self.httpResponse.url?.absoluteString
        }
    }
    
    @objc var status:Int {
        get {
            return self.httpResponse.statusCode
        }
    }
    
    @objc var redirected:Bool {
        get {
            return self.fetchOperation.redirected
        }
    }
    
    @objc var ok:Bool {
        get {
            return status >= 200 && status < 300
        }
    }
    
    @objc var statusText:String {
        get {
            
            if HttpStatusCodes[self.status] != nil {
                return HttpStatusCodes[self.status]!
            }
            return "Unassigned"
        }
    }
    
    init(response: HTTPURLResponse, operation:FetchOperation, callback: @escaping (URLSession.ResponseDisposition) -> Void) {
        self.httpResponse = response
        self.responseCallback = callback
        self.fetchOperation = operation
        
        // Convert to our custom FetchHeaders class
        let headers = FetchHeaders()
        response.allHeaderFields.keys.forEach { key in
            
            if (key as! String).lowercased() == "content-encoding" {
                // URLSession automatically decodes content (which we don't actually want it to do)
                // so the only way to continue to use this is to strip out the Content-Encoding
                // header, otherwise the browser will try to decode it again
                return
            }
            
            headers.set(key as! String, response.allHeaderFields[key] as! String)
        }
        
        self.headers = headers
        
        super.init()
//        self.fetchOperation.add(delegate: self)

    }
    
    deinit {
        if self.fetchOperation.task!.state == .running {
            Log.warn?("Terminating currently pending fetch operation for: " + self.fetchOperation.request.url.absoluteString)
            self.fetchOperation.task!.cancel()
        }
    }
    
}
