//
//  NativeFetchHandler.swift
//  ServiceWorker
//
//  Created by alastair.coote on 07/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared

class NativeFetchHandler : NSObject, URLSessionTaskDelegate, URLSessionDataDelegate {
    
    let request:FetchRequest
    var task:URLSessionDataTask?
    let responseReadyCallback:ResponseReadyCallback
    fileprivate var responseHandleInstruction:ResponseHandleInstruction?
    
    typealias ResponseReadyCallback = (Error?) -> Void
    typealias ResponseHandleInstruction = (URLSession.ResponseDisposition) -> Void
    
    init(request: FetchRequest, cb: @escaping ResponseReadyCallback) {
        
        self.request = request
        self.responseReadyCallback = cb
        super.init()
        
        var cachePolicy:URLRequest.CachePolicy = .returnCacheDataElseLoad
        if self.request.cache == FetchRequestCache.NoCache {
            cachePolicy = .reloadIgnoringLocalCacheData
        } else if self.request.cache == .Reload {
            cachePolicy = .reloadRevalidatingCacheData
        }
        
        var nsRequest = URLRequest(url: self.request.url, cachePolicy: cachePolicy, timeoutInterval: 60)
        
        if let headers = self.request.headers {
            headers.keys().forEach { key in
                nsRequest.addValue(headers.get(key)!, forHTTPHeaderField: key)
            }
        }
        
        let session = URLSession(configuration: URLSessionConfiguration.default, delegate: self, delegateQueue: OperationQueue.main)
        
        self.task = session.dataTask(with: nsRequest)
        
        self.task!.resume()
        
    }
    
    func setResponseBehaviour(_ behaviour: URLSession.ResponseDisposition) throws {
        if self.responseHandleInstruction == nil {
            throw ErrorMessage("Cannot set behaviour before start of response has been received")
        }
        self.responseHandleInstruction!(behaviour)
        self.responseHandleInstruction = nil
    }
    
    deinit {
        // Clean up - if this is dereferenced and still has a connection alive, close it.
        if let instruct = self.responseHandleInstruction {
            instruct(URLSession.ResponseDisposition.cancel)
        }
    }
    
    
    /// This is called when an error is encountered while fetching the header data
    func urlSession(_ session: URLSession, didBecomeInvalidWithError error: Error?) {
        self.responseReadyCallback(error)
    }
    
    /// This is run when we have received the headers but have not yet started receiving
    /// the body.
    internal func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive response: URLResponse, completionHandler: @escaping (URLSession.ResponseDisposition) -> Void) {
        
        // store this for later use
        self.responseHandleInstruction = completionHandler
    }
    
    
}
