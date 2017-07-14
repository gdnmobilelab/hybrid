//
//  FetchOperation.swift
//  ServiceWorker
//
//  Created by alastair.coote on 13/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared

@objc public class FetchOperation : NSObject, URLSessionDataDelegate, URLSessionTaskDelegate {
    
    public typealias ResponseCallback = (Error?, FetchResponse?) -> Void
    
    let request:FetchRequest
    var task:URLSessionTask?
    var session: URLSession?
    
    var redirected = false
    
    var responseIsReadyCallback:ResponseCallback
    
    public init(_ request:FetchRequest, _ callback: @escaping ResponseCallback) {
        
        self.request = request
        self.responseIsReadyCallback = callback
        
        var cachePolicy:URLRequest.CachePolicy = .returnCacheDataElseLoad
        if self.request.cache == FetchRequestCache.NoCache {
            cachePolicy = .reloadIgnoringLocalCacheData
        } else if self.request.cache == .Reload {
            cachePolicy = .reloadRevalidatingCacheData
        }
        
        if self.request.redirect == .Manual {
            // For some reason the combination of not following redirects and using caches will break.
            // Appears to be this: http://www.openradar.me/31284156
            cachePolicy = .reloadIgnoringLocalCacheData
        }
        
        
        var nsRequest = URLRequest(url: self.request.url, cachePolicy: cachePolicy, timeoutInterval: 60)
        
        nsRequest.httpMethod = self.request.method
        
        if let headers = self.request.headers {
            headers.keys().forEach { name in
                nsRequest.addValue(headers.get(name)!, forHTTPHeaderField: name)
            }
        }
        
        if let body = self.request.body {
            nsRequest.httpBody = body
        }
        
        super.init()
        
        self.session = URLSession(configuration: URLSessionConfiguration.default, delegate: self, delegateQueue: OperationQueue.main)
        
        self.task = self.session!.dataTask(with: nsRequest)
        
        self.task!.resume()
    }
    
    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        NSLog("Error?")
    }
    
    public func urlSession(_ session: URLSession, didBecomeInvalidWithError error: Error?) {
        NSLog("sdfsdf")
    }
    
    public func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        
        // Control whether we follow HTTP redirects or not. If we return nil, it won't.
        
        if self.request.redirect == .Follow {
            completionHandler(request)
            
        } else if self.request.redirect == .Error {
            completionHandler(nil)
            let err = ErrorMessage("Response redirected when this was not expected")
            self.responseIsReadyCallback(err,nil)
            self.task!.cancel()
            
        } else {
            completionHandler(nil)
            
        }
        
        self.redirected = true
        
    }
    
  
    /// This is run when we have received the headers but have not yet started receiving
    /// the body. This is the point at which we return the fetch() promise with this Response
    /// object, and the JS can then call .text(), .json() etc.
    public func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        
        let asHTTP = response as! HTTPURLResponse
        
        let response = FetchResponse(response: asHTTP, operation:self, callback: completionHandler)
        
        self.responseIsReadyCallback(nil, response)
        
    }
    

    
}
