//
//  FetchResponse.swift
//  ServiceWorker
//
//  Created by alastair.coote on 13/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared
import JavaScriptCore

@objc protocol FetchResponseExports : JSExport {
    func json() -> JSValue
    func text() -> JSValue
    var headers: FetchHeaders {get}
}

@objc public class FetchResponse : NSObject, FetchResponseExports, URLSessionDataDelegate {
    
    internal var fetchOperation: FetchOperation?
    internal var responseCallback: ((URLSession.ResponseDisposition) -> Void)?
    
    let headers:FetchHeaders
    var bodyUsed:Bool = false
    internal var dataStream: ReadableStream?
    fileprivate var streamController:ReadableStreamController?
    
    /// We use this context when using the JS-type functions, like json() etc
    /// to create JSPromises
    internal var jsContext:JSContext?
    
    var internalResponse:FetchResponse {
        get {
            return self
        }
    }
    
    var type:ResponseType {
        get {
            return .Internal
        }
    }

    
    let url:URL
    let status:Int
    let redirected:Bool
    
    var ok:Bool {
        get {
            return status >= 200 && status < 300
        }
    }
    
    var statusText:String {
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
        if let op = self.fetchOperation {
            op.add(delegate: self)
        }
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
    
    public func urlSession(_ session: URLSession, task: URLSessionTask, didCompleteWithError error: Error?) {
        self.streamController!.close()
    }
    
    internal func data(_ callback: @escaping (Error?, Data?) -> Void) {
        
        var reader:ReadableStream
        
        do {
            reader = try self.getReader()
        } catch {
            callback(error, nil)
            return
        }
        
        var allData = Data()
        
        // Annoying but I can't find any other way to get around Swift complaining
        // about “Variable used within its own initial value”
        
        var doRead: (() -> Void)? = nil
        doRead = {
            reader.read { read in
                if read.done {
                    callback(nil, allData)
                } else {
                    allData.append(read.value!)
                    doRead!()
                }
                
            }
        }
        
        doRead!()
        
    }
    
    public func text(_ callback: @escaping (Error?, String?) -> Void) {
        self.data { err, data in
            
            if err != nil {
                callback(err, nil)
                return
            }
            
            do {
       
                var charset = String.Encoding.utf8
                
                if let contentTypeHeader = self.headers.get("Content-Type") {
                    let charsetRegex = try NSRegularExpression(pattern: ";\\s?charset=(.*)+", options: [])
                    let charsetMatches = charsetRegex.matches(in: contentTypeHeader, options: [], range: NSRange(location: 0, length: contentTypeHeader.characters.count))

                    if let relevantMatch = charsetMatches.first {
                        
                        let matchText = (contentTypeHeader as NSString).substring(with: relevantMatch.range).lowercased()
                        
                        if matchText == "utf-16" {
                            charset = String.Encoding.utf16
                        } else if matchText == "utf-32" {
                            charset = String.Encoding.utf32
                        } else if matchText == "iso-8859-1" {
                            charset = String.Encoding.windowsCP1252
                        }
                    }
                }
               
                let asString = String(data: data!, encoding: charset)
                callback(nil, asString)
                
            } catch {
                callback(error, nil)
            }
  
                
        }

    }
    
    internal func json() -> JSValue {
        let promise = JSPromise(context: self.jsContext!)
        
        self.json() { err, json in
            if err != nil {
                promise.reject(err!)
            } else {
                promise.fulfill(json)
            }
        }
        
        return promise.jsValue
    }
    
    internal func text() -> JSValue {
        
        let promise = JSPromise(context: self.jsContext!)
        
        self.text() { err, text in
            if err != nil {
                promise.reject(err!)
            } else {
                promise.fulfill(text)
            }
        }
        
        return promise.jsValue
        
    }
    
    public func json(_ callback: @escaping (Error?, Any?) -> Void) {
    
         self.data { err, data in
                
            if err != nil {
                callback(err, nil)
                return
            }
            
            do {
                let json = try JSONSerialization.jsonObject(with: data!, options: [])
                callback(nil, json)
            } catch {
                callback(error, nil)
            }
            
        }

    }
    
    init(headers: FetchHeaders, status: Int, url:URL, redirected:Bool, stream:ReadableStream) {
        self.fetchOperation = nil
        self.responseCallback = nil
        self.headers = headers
        self.status = status
        self.url = url
        self.redirected = redirected
        self.dataStream = stream
        self.streamController = stream.controller
    }
    
    
    init(response: HTTPURLResponse, operation:FetchOperation, callback: @escaping (URLSession.ResponseDisposition) -> Void) {
        self.fetchOperation = operation
        self.responseCallback = callback
        self.status = response.statusCode
        self.url = response.url!
        self.redirected = operation.redirected
        
        // Convert to our custom FetchHeaders class
        let headers = FetchHeaders()
        response.allHeaderFields.keys.forEach { key in
            
            let keyString = key as! String
            let value = response.allHeaderFields[key] as! String
            
            if keyString.lowercased() == "content-encoding" {
                // URLSession automatically decodes content (which we don't actually want it to do)
                // so the only way to continue to use this is to strip out the Content-Encoding
                // header, otherwise the browser will try to decode it again
                return
            } else if keyString.lowercased() == "content-length" {
                // Because of this same GZIP issue, the content length will be incorrect. It's actually
                // also normally incorrect, but because we're stripping out all encoding we should
                // update the content-length header to be accurate.
                headers.set("Content-Length", String(operation.task!.countOfBytesExpectedToReceive))
                return
            }
            
            headers.set(keyString, value)
        }
        
        self.headers = headers
        
        super.init()
        
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
