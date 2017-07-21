//
//  CORSResponse.swift
//  ServiceWorker
//
//  Created by alastair.coote on 20/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

fileprivate var CORSHeaders = [
    "cache-control",
    "content-language",
    "content-type",
    "expires",
    "last-modified",
    "pragma"
]

@objc class CORSResponse : FetchResponse {
    
    fileprivate let _internal:FetchResponse
    
    override var internalResponse: FetchResponse {
        get {
            return self._internal
        }
    }
    
    override var responseType: ResponseType {
        get {
            return .CORS
        }
    }
    
    init(from response: FetchResponse, allowedHeaders: [String]?) {
        
        self._internal = response
        
        let filteredHeaders = FetchHeaders()
        
        var allAllowedHeaders:[String] = []
        allAllowedHeaders.append(contentsOf: CORSHeaders)
        if allowedHeaders != nil {
            allAllowedHeaders.append(contentsOf: allowedHeaders!)
        }
        
        allAllowedHeaders.forEach { key in
            if let val = response.headers.get(key) {
                filteredHeaders.set(key, val)
            }
        }
        
        super.init(headers: filteredHeaders, status: response.status, url: response.url, redirected: response.redirected, fetchOperation: nil, stream: response.dataStream)

    }
    
}
