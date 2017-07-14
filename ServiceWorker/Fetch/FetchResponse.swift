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
    
    fileprivate let fetchOperation: FetchOperation?
    fileprivate var responseCallback: ((URLSession.ResponseDisposition) -> Void)?
    
    let headers:FetchHeaders
    var bodyUsed:Bool = false
    fileprivate var dataStream: ReadableStream?
    fileprivate var streamController:ReadableStreamController?
    
    @objc let url:String
    @objc let status:Int
    @objc let redirected:Bool
    
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
    
    fileprivate func markBodyUsed() throws {
        if self.bodyUsed == true {
            throw ErrorMessage("Body was already used")
        }
        self.bodyUsed = true
    }
    
    func getReader() throws -> ReadableStream {
        try self.markBodyUsed()
        if let responseCallback = self.responseCallback {
            responseCallback(.allow)
        }
        return self.dataStream!
    }
    
    public func urlSession(_ session: URLSession, dataTask: URLSessionDataTask, didReceive data: Data) {
        do {
            try self.streamController!.enqueue(data)
        } catch {
            Log.error?("Failed to enqueue data:")
        }
    }
    
    init(response: HTTPURLResponse, operation:FetchOperation, callback: @escaping (URLSession.ResponseDisposition) -> Void) {
        self.fetchOperation = operation
        self.responseCallback = callback
        self.status = response.statusCode
        self.url = response.url!.absoluteString
        self.redirected = operation.redirected
        
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
        self.fetchOperation!.add(delegate: self)
        
        self.dataStream = ReadableStream(start: { controller in
            self.streamController = controller
        })

    }
    
    deinit {
        if self.fetchOperation?.task!.state == .running {
            Log.warn?("Terminating currently pending fetch operation for: " + self.fetchOperation!.request.url.absoluteString)
            self.fetchOperation!.task!.cancel()
        }
    }
    
}
