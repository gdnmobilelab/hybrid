//
//  FetchOperation.swift
//  ServiceWorker
//
//  Created by alastair.coote on 13/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared
import JavaScriptCore

@objc public class FetchOperation : MultiDataDelegate {
    
    public typealias ResponseCallback = (Error?, FetchResponseProtocol?) -> Void
    
    let request:FetchRequest
    var task:URLSessionTask?
    var session: URLSession?
    
    var redirected = false
    
    var responseIsReadyCallback:ResponseCallback?
    
    public static func fetch(_ url: String, _ callback: @escaping ResponseCallback) {
        let request = FetchRequest(url: URL(string: url)!)
        _ = FetchOperation(request, callback)
    }
    
    public static func fetch(_ request: FetchRequest, _ callback: @escaping ResponseCallback) {
        _ = FetchOperation(request, callback)
    }
    
    fileprivate static func jsFetch(context:JSContext, origin:URL?, requestOrURL: JSValue, options: JSValue?) -> JSValue {
        
        var request:FetchRequest
        let promise = JSPromise(context: context)
        
        if requestOrURL.isInstance(of: FetchRequest.self) {
            request = requestOrURL.toObjectOf(FetchRequest.self) as! FetchRequest
        } else if requestOrURL.isString {
            request = FetchRequest(url: URL(string: requestOrURL.toString())!)
        } else {
            promise.reject(ErrorMessage("Did not understand first argument passed in"))
            return promise.jsValue
        }
        
        if options != nil {
            do {
                if let opts = options!.toObject() as? [String: AnyObject] {
                    try request.applyOptions(opts: opts)
                } else if options!.isNull == false && options!.isUndefined == false {
                    throw ErrorMessage("Did not understand options parameter")
                }
            } catch {
                promise.reject(error)
                return promise.jsValue
            }
        }
        
        if let originURL = origin {
            do {
                try request.enforceOrigin(origin: originURL)
            }
            catch {
                promise.reject(error)
                return promise.jsValue
            }
        }

        
        FetchOperation.fetch(request) { err, res in
            if err != nil {
                promise.reject(err!)
            } else {
                res!.internalResponse.jsContext = context
                promise.fulfill(res!)
            }
        }
        
        return promise.jsValue
        
    }
    
    public static func addToJSContext(context:JSContext, origin: URL? = nil) {
        
        let fetchFunc: @convention(block) (JSValue, JSValue?) -> JSValue = { req, opts in
            return self.jsFetch(context: context, origin: origin, requestOrURL: req, options: opts)
        }
        
        context.globalObject.setValue(unsafeBitCast(fetchFunc, to: AnyObject.self), forProperty: "fetch")
        
    }
    
    fileprivate var allowedCORSHeaders:[String]? = nil
    
    fileprivate func performCORSCheck(_ cb: @escaping (Error?) -> Void) {
        
        if self.request.mode != .CORS || self.request.origin == nil || self.request.origin!.host == self.request.url.host {
            cb(nil)
            return
        }
        
        let optionsRequest = FetchRequest(url: self.request.url)
        optionsRequest.method = "OPTIONS"
        
        FetchOperation.fetch(optionsRequest) { err, res in
            
            if err != nil {
                cb(err)
                return
            }
            
            let allowedOrigin = res!.headers.get("Access-Control-Allow-Origin")
            
            if allowedOrigin == "*" || allowedOrigin == self.request.origin!.scheme! + "://" + self.request.origin!.host! {
                
                if let allowedHeaders = res!.headers.get("Access-Control-Expose-Headers") {
                    
                    self.allowedCORSHeaders = allowedHeaders
                        .split(separator: ",")
                        .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines)}
                    
                }
                
                if let allowedMethods = res!.headers.get("Access-Control-Allow-Methods") {
                    let allowedMethodsSplit = allowedMethods
                        .split(separator: ",")
                        .map { String($0).trimmingCharacters(in: .whitespacesAndNewlines)}
                    
                    if allowedMethodsSplit.contains(self.request.method) == false {
                        cb(ErrorMessage("Method not supported in CORS"))
                        return
                    }
                }
                
                cb(nil)
            } else {
                cb(ErrorMessage("Access-Control-Allow-Origin does not match or does not exist"))
            }
            
        }
        
        
        
    }
    
    fileprivate init(_ request:FetchRequest, _ callback: @escaping ResponseCallback) {
        
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
        
        self.performCORSCheck { err in
            if err != nil {
                callback(err, nil)
            } else {
                self.session = URLSession(configuration: URLSessionConfiguration.default, delegate: self, delegateQueue: OperationQueue.main)
                
                self.task = self.session!.dataTask(with: nsRequest)
                
                self.task!.resume()
            }
        }
        
        
        
    }
    
    fileprivate func sendResponse(_ err:Error?, _ res: FetchResponseProtocol?) {
        self.responseIsReadyCallback!(err, res)
        self.responseIsReadyCallback = nil
    }
    
    
    override public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        super.urlSession(session, task: task, didCompleteWithError: error)
        if let errorExists = error {
            if errorExists.localizedDescription.contains("cancel") == false {
                self.sendResponse(errorExists, nil)
            }
        }
        
    }
    
    override public func urlSession(_ session: URLSession, didBecomeInvalidWithError error: Error?) {
        super.urlSession(session, didBecomeInvalidWithError: error)
        NSLog("sdfsdf")
    }
    
    public func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        
        // Control whether we follow HTTP redirects or not. If we return nil, it won't.
        
        if self.request.redirect == .Follow {
            completionHandler(request)
            
        } else if self.request.redirect == .Error {
            completionHandler(nil)
            let err = ErrorMessage("Response redirected when this was not expected")
            self.sendResponse(err,nil)
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
        
        if self.redirected == true && self.request.redirect == .Error {
            // This is still run even when we cancel a task. So if we've already thrown
            // we want to ignore this completion event
            return
        }
        
        let internalResponse = FetchResponse(response: asHTTP, operation:self, callback: completionHandler)
        var filteredResponse:FetchResponseProtocol
        
        let isCrossDomain = self.request.origin != nil && self.request.origin!.host != internalResponse.url.host
        
        if self.request.mode == .NoCORS && isCrossDomain {
            filteredResponse = OpaqueResponse(from: internalResponse)
        } else if self.request.mode == .CORS && isCrossDomain {
            filteredResponse = CORSResponse(from: internalResponse, allowedHeaders: self.allowedCORSHeaders)
        } else {
            filteredResponse = BasicResponse(from: internalResponse)
        }

        self.sendResponse(nil, filteredResponse)
        
    }
    

    
}
