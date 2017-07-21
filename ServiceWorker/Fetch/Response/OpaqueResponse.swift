//
//  OpaqueResponse.swift
//  ServiceWorker
//
//  Created by alastair.coote on 20/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

@objc class OpaqueResponse : FetchResponse {
    
    fileprivate let _internal:FetchResponse
    
    override var internalResponse: FetchResponse {
        get {
            return self._internal
        }
    }
    
    override var responseType: ResponseType {
        get {
            return .Opaque
        }
    }
    
    init(from response: FetchResponse) {
        
        self._internal = response
        
        let noHeaders = FetchHeaders()
        
        let emptyStream = ReadableStream(start: { controller in
            controller.close()
        })
 
        super.init(headers: noHeaders, status: 0, url: response.url, redirected: false, fetchOperation: nil, stream: emptyStream)

    }
}
