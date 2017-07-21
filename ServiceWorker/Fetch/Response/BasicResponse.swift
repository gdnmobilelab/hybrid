//
//  BasicResponse.swift
//  ServiceWorker
//
//  Created by alastair.coote on 20/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc class BasicResponse : FetchResponse {
    
    fileprivate let _internal:FetchResponse
    
    override var internalResponse: FetchResponse {
        get {
           return self._internal
        }
    }
    
    override var responseType: ResponseType {
        get {
            return .Basic
        }
    }
    
    init(from response:FetchResponse) {
        
        self._internal = response
        let filteredHeaders = FetchHeaders()
        
        response.headers.keys().forEach { key in
            if key.lowercased() == "set-cookie" || key.lowercased() == "set-cookie2" {
                return
            }
            filteredHeaders.set(key, response.headers.get(key)!)
        }
        
        super.init(headers: filteredHeaders, status: response.status, url: response.url, redirected: response.redirected, fetchOperation: nil, stream: response.dataStream)

    }
    
}
