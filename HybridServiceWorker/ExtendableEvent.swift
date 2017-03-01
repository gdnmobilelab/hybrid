//
//  ExtendableEvent.swift
//  hybrid
//
//  Created by alastair.coote on 10/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit
import HybridShared

class PromiseAlreadyResolvedError : Error {}

/// The parts we expose natively
public protocol ExtendableEventProtocol : ExtendableEventExports, JSExport {
    func resolve() -> Promise<Void>
}

/// The parts we expose to JS
@objc public protocol ExtendableEventExports: JSEvent, JSExport {
    func waitUntil(_ promise:JSValue)
}

@objc public class ExtendableEvent : NSObject {
    
    var waitUntilPromise:JSValue?
    var hasResolved = false
    
    public func waitUntil(_ promise:JSValue) {
        
        // JavascriptCore doesn't like functions that throw. Not sure what to do about that.
        
        //        if self.hasResolved == true {
        //            throw PromiseAlreadyResolvedError()
        //        }
        self.waitUntilPromise = promise
    }
    
    public func resolve() -> Promise<Void> {
        self.hasResolved = true
        if self.waitUntilPromise == nil {
            return Promise(value: ())
        }
        
        return JSPromiseToPromise<Void>.pass(self.waitUntilPromise!)
        
    }
    
}
