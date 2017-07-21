//
//  FetchResponseProxy.swift
//  ServiceWorker
//
//  Created by alastair.coote on 21/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

@objc class FetchResponseProxy : NSObject, FetchResponseProtocol, FetchResponseJSExports {
   
    var url: URL {
        get {
            return self._internal.url
        }
    }
    
    var responseType: ResponseType {
        get {
            return .Internal
        }
    }
    
    func getReader() throws -> ReadableStream {
        return try self._internal.getReader()
    }
    
    
    let _internal:FetchResponse
    
    init(from response: FetchResponse) {
        self._internal = response
    }
    
    var internalResponse: FetchResponse {
        get {
            return self._internal
        }
    }
    
    func json(_ cb: @escaping (Error?, Any?) -> Void) {
        self._internal.json(cb)
    }
    
    func text(_ cb: @escaping (Error?, String?) -> Void) {
        self._internal.text(cb)
    }
    
    func json() -> JSValue {
        return self._internal.json()
    }
    
    func text() -> JSValue {
        return self._internal.text()
    }
    
    func cloneInternalResponse() -> FetchResponse {
        return FetchResponse(headers: self._internal.headers, status: self._internal.status, url: self._internal.url, redirected: self._internal.redirected, fetchOperation: self._internal.fetchOperation)
    }
    
    func clone() throws -> FetchResponseProtocol {
        
        if self.bodyUsed {
            throw ErrorMessage("Cannot clone response: body already used")
        }
        
        let clonedInternalResponse = self.cloneInternalResponse()
        
        if self.responseType == .Basic {
            return BasicResponse(from: clonedInternalResponse)
        } else if self.responseType == .Opaque {
            return OpaqueResponse(from: clonedInternalResponse)
        } else {
            // CORS overrides this, so that we can handle allowed headers
            throw ErrorMessage("Do not know how to clone this type of response")
        }
        
    }
    
    func cloneResponseExports() -> FetchResponseJSExports? {
        // Really dumb but I can't figure out a better way to export both
        // clone() for Swift and clone() for JS
        
        var clone:FetchResponseJSExports? = nil
        
        do {
            clone = try self.clone()
        } catch {
            
            var errmsg = String(describing: error)
            if let err = error as? ErrorMessage {
                errmsg = err.message
            }
            
            self.internalResponse.jsContext!.exception = JSValue(newErrorFromMessage: errmsg, in: self.internalResponse.jsContext!)
        }
        
        return clone
    }
    
    var headers: FetchHeaders {
        get {
            return self._internal.headers
        }
    }
    
    var statusText: String {
        get {
            return self._internal.statusText
        }
    }
    
    var ok: Bool {
        get {
            return self._internal.ok
        }
    }
    
    var redirected: Bool {
        get {
            return self._internal.redirected
        }
    }
    
    var bodyUsed: Bool {
        get {
            return self._internal.bodyUsed
        }
    }
    
    var status: Int {
        get {
            return self._internal.status
        }
    }
    
    var responseTypeString: String {
        get {
            return self.responseType.rawValue
        }
    }
    
    var urlString: String {
        get {
            return self.url.absoluteString
        }
    }
    
    
}
