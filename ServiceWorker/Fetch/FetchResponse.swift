//
//  FetchResponse.swift
//  ServiceWorker
//
//  Created by alastair.coote on 21/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared

@objc class FetchResponse : NSObject, URLSessionTaskDelegate, URLSessionDataDelegate {
    
    let request: FetchRequest
    @objc var headers: FetchHeaders?
    @objc var redirected = false
    @objc var status:Int = -1
    @objc var bodyUsed = false
    var dataStore:NSMutableData? = nil
    
    init(forRequest request: FetchRequest) {
        self.request = request
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
    
    // Once headers have been processed, we then wait for the JS to run .json(), .text() etc. etc.
    // we call this callback when that choice has been made.
    fileprivate var responseCallback: ((URLSession.ResponseDisposition) -> Void)?
    
    var responseIsReadyCallback:((Error?) -> Void)?
    
    internal func startFetch(_ cb: @escaping (Error?) -> Void) {
        
        self.responseIsReadyCallback = cb
        
        var cachePolicy:URLRequest.CachePolicy = .returnCacheDataElseLoad
        if self.request.cache == FetchRequestCache.NoCache {
            cachePolicy = .reloadIgnoringLocalCacheData
        } else if self.request.cache == .Reload {
            cachePolicy = .reloadRevalidatingCacheData
        }
        
        let nsRequest = URLRequest(url: self.request.url, cachePolicy: cachePolicy, timeoutInterval: 60)
        
        let session = URLSession(configuration: URLSessionConfiguration.default, delegate: self, delegateQueue: OperationQueue.main)
        
        let task = session.dataTask(with: nsRequest)
        
        task.resume()
    }
    
    var dataCallback: ((Error?, Data?) -> Void)? = nil
    
    func data(_ cb: @escaping (Error?, Data?) -> Void) {
        if self.responseCallback == nil {
            cb(ErrorMessage("Called text() before response was ready"), nil)
        }
        if self.bodyUsed {
            cb(ErrorMessage("Response body has already been used"), nil)
        }
        self.bodyUsed = true
        self.dataCallback = cb
        self.dataStore = NSMutableData()
        self.responseCallback!(URLSession.ResponseDisposition.allow)
    }
    
    
    public func text(_ cb: @escaping (Error?, String?) -> Void) {
        
        self.data { err, data in
            if err != nil {
                cb(err, nil)
            }
            
            // todo - read in character encoding
            let str = String(data: data!, encoding: String.Encoding.utf8)
            cb(nil, str)
            
        }
        
    }
    
    public func json(_ cb: @escaping (Error?, Any?) -> Void) {
        
        // JSON comes from text, so let's just reuse the text functionality
        self.data { err, data in
            if err != nil {
                cb(err,nil)
            }
            
            do {
                let json = try JSONSerialization.jsonObject(with: data!)
                cb(nil, json)
            } catch {
                cb(error, nil)
            }
            
        }
    }
    
    // This runs whenever new data is found.
    func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        self.dataStore!.append(data)
    }
    
    func urlSession(_ session: URLSession, didBecomeInvalidWithError error: Error?) {
        self.responseIsReadyCallback!(error)
    }
    
    func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        if error != nil {
            self.responseIsReadyCallback!(error!)
        }
        
        if self.dataCallback != nil {
            self.dataCallback!(nil, self.dataStore! as Data)
            self.dataStore = nil
        }
        
    }
    
    internal func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        
        let asHTTP = response as! HTTPURLResponse
        
        // Convert to our custom FetchHeaders class
        let headers = FetchHeaders()
        asHTTP.allHeaderFields.keys.forEach { key in
            
            if (key as! String).lowercased() == "content-encoding" {
                // URLSession automatically decodes content (which we don't actually want it to do)
                // so the only way to continue to use this is to strip out the Content-Encoding
                // header, otherwise the browser will try to decode it again
                return
            }
            
            headers.set(key as! String, asHTTP.allHeaderFields[key] as! String)
        }
        
        self.headers = headers
        self.status = asHTTP.statusCode
        
        
        self.responseCallback = completionHandler
        self.responseIsReadyCallback!(nil)
    }
    
    public static func fetch(fromRequest: FetchRequest, _ cb: @escaping (Error?, FetchResponse) -> Void) {
        
        let res = FetchResponse(forRequest: fromRequest)
        res.startFetch { err in
            cb(err, res)
        }
        
    }
    
    internal func urlSession(_ session: URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: @escaping (URLRequest?) -> Void) {
        
        // Control whether we follow HTTP redirects or not. If we return nil, it won't.
        
        if self.request.redirect == .Follow {
            completionHandler(request)
        } else {
            completionHandler(nil)
        }
        
        // There is also .Error in the spec. We can't throw an error here, but we will later on.
        self.redirected = true
        
    }
    
}
