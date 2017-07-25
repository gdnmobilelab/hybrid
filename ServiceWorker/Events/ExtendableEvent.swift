//
//  ExtendableEvent.swift
//  ServiceWorker
//
//  Created by alastair.coote on 24/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

@objc protocol ExtendableEventExports : JSExport {
    func waitUntil(_: JSValue) -> Void
}

@objc public class ExtendableEvent : Event, ExtendableEventExports {
    
    public enum ExtendableEventState {
        case Valid
        case Invalid
        case Resolved
    }
    
    var state:ExtendableEventState = .Valid
    fileprivate var pendingPromises: [JSValue] = []
    
    
    fileprivate var resolvedError:Error?
    fileprivate var pendingResolves: [(Error?) -> Void] = []
    
    func waitUntil(_ val:JSValue) {
        
        if self.state == .Invalid {
            val.context.exception = JSValue(newErrorFromMessage: "Invalid state for waitUntil()", in: val.context)
            return
        }
        
        let success: @convention(block) (JSValue) -> JSValue? = self.nextPromiseOrResolve
        let failure: @convention(block) (JSValue) -> Void = self.catchError
      
        // It's possible to pass a non-promise to waitUntil (don't know
        // why you would, but you can) so we'll call Promise.resolve()
        // on it first.
        let chained = val.context.evaluateScript("""
            (function(promise, success, failure) {
                return Promise.resolve(promise)
                .then(function(val) {success(val)})
                .catch(function(err) {failure(err)})
            })
        """).call(withArguments: [val, unsafeBitCast(success, to: AnyObject.self), unsafeBitCast(failure, to: AnyObject.self)])
        
        self.pendingPromises.append(chained!)
        
    }
    
    fileprivate func catchError(err:JSValue) {
        let msg = err.objectForKeyedSubscript("message").toString()
        let err = ErrorMessage(msg!)
        self.resolvedError = err
        self.runPendingResolves()
    }
    
    fileprivate func nextPromiseOrResolve(val: JSValue) -> JSValue? {
        _ = self.pendingPromises.removeFirst()
        if let nextPromise = self.pendingPromises.first {
            return nextPromise
        } else {
            self.runPendingResolves()
            return nil
        }
    }
    
    fileprivate func runPendingResolves() {
        self.state = .Resolved
        self.pendingResolves.forEach { $0(self.resolvedError)}
    }
    
    public func resolve(_ funcToRun: @escaping (Error?) -> Void) {
        if self.state == .Resolved {
            funcToRun(self.resolvedError)
        } else if self.pendingPromises.count == 0 {
            funcToRun(nil)
        } else {
            self.pendingResolves.append(funcToRun)
        }
    }
    
}
