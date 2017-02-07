//
//  FetchBody.swift
//  hybrid
//
//  Created by alastair.coote on 06/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import HybridShared

/// The part of our FetchBody object that will be available inside a JSContext
@objc public protocol FetchBodyExports : JSExport {
    
    @objc(json)
    func json_jsPromise() -> JSPromise
    
    @objc(text)
    func text_jsPromise() -> JSPromise
    
    @objc(blob)
    func blob_jsPromise() -> JSPromise
    //    func arrayBuffer() -> JSPromise
    var bodyUsed:Bool {get}
}

extension FetchBody : FetchBodyExports {
    
    @objc(json)
    public func json_jsPromise() -> JSPromise {
        return PromiseToJSPromise.pass(self.json())
    }
    
    @objc(text)
    public func text_jsPromise() -> JSPromise {
        return PromiseToJSPromise.pass(self.text())
    }

    @objc(blob)
    public func blob_jsPromise() -> JSPromise {
        return PromiseToJSPromise.pass(self.blob())
    }
}
