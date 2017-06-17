//
//  ServiceWorkerExecutionEnvironment.swift
//  ServiceWorker
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

@objc public class ServiceWorkerExecutionEnvironment : NSObject {
    
    let jsContext: JSContext
    let globalScope: ServiceWorkerGlobalScope
    
    @objc public override init() {
        self.jsContext = JSContext()
        self.globalScope = ServiceWorkerGlobalScope(context: self.jsContext)
        
        super.init()
        self.jsContext.exceptionHandler = self.grabException
    }
    
    func destroy() {
        self.jsContext.exceptionHandler = nil
        self.currentException = nil
    }
    
    // Thrown errors don't error on the evaluateScript call (necessarily?), so after
    // evaluating, we need to check whether there is a new exception.
    fileprivate var currentException:JSValue?
    fileprivate func grabException(context: JSContext?, error: JSValue?) {
        self.currentException = error
    }
    
    @objc public func evaluateScript(_ script:String) throws -> JSValue {
        
        if self.currentException != nil {
            throw ErrorMessage("Cannot run script while context has an exception")
        }
        
        var returnVal = self.jsContext.evaluateScript(script)
        
        if self.currentException != nil {
            let exc = self.currentException!
            self.currentException = nil
            throw ErrorMessage(exc.toString())
        }
        
        // Can't return an optional value because ObjC doesn't supoort it.
        
        if returnVal == nil {
            returnVal = JSValue(undefinedIn: self.jsContext)
        }
        
        return returnVal!
    }
    
}
