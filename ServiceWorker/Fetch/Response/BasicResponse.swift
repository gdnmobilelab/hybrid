//
//  BasicResponse.swift
//  ServiceWorker
//
//  Created by alastair.coote on 20/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc class BasicResponse : FetchResponseProxy {
    
    fileprivate let filteredHeaders:FetchHeaders
    
    override var responseType: ResponseType {
        get {
            return .Basic
        }
    }
    
    override var headers: FetchHeaders {
        get {
            return self.filteredHeaders
        }
    }
    
    override init(from response:FetchResponse) {
        let filteredHeaders = FetchHeaders()
        
        response.headers.keys().forEach { key in
            if key.lowercased() == "set-cookie" || key.lowercased() == "set-cookie2" {
                return
            }
            filteredHeaders.set(key, response.headers.get(key)!)
        }
        
        self.filteredHeaders = filteredHeaders
        
        super.init(from: response)

    }
    
}
