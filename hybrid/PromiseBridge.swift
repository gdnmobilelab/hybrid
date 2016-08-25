//
//  PromiseBridge.swift
//  hybrid
//
//  Created by alastair.coote on 18/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import JavaScriptCore

@objc protocol JSPromiseBridgeExports: JSExport {
    func jsSuccess(success: JSValue) -> Void
    func jsFailure(failure: JSValue) -> Void
    
}

@objc public class JSPromiseBridge: NSObject, JSPromiseBridgeExports {
    
    typealias CompleteFunc = (JSValue?, JSValue?) -> Void
   
    let completeFunc:CompleteFunc
    
    init(completeChunk: CompleteFunc) {
        self.completeFunc = completeChunk
    }
    
    public func jsSuccess(success: JSValue) {
        self.completeFunc(success, nil)
    }
    
    public func jsFailure(failure: JSValue) {
        self.completeFunc(nil, failure)
    }
}

class TestError : ErrorType {}

class PromiseBridge<T: NSObject> : Promise<T?> {
    
//    init(jsContext: JSContext, path: String, args: [AnyObject]) {
//        
//    }
    
    init(jsPromise:JSValue) {
        super.init { (fulfill, reject) in
            
            let completeChunk = { (success: JSValue?, failure:JSValue?) in
                
                if failure != nil {
                    log.error(failure!.toString())
                    reject(JSContextError(message: failure!.toString()))
                    
                } else {
                    if success!.isUndefined || success!.isNull {
                        fulfill(nil)
                        return
                    }
                    log.debug("Converting " + success!.toString() + " to instance of " + String(T.self))
                    let convertedObject = success!.toObjectOfClass(T.self as AnyClass) as! T
                    fulfill(convertedObject)
                }
                
                
            }
            
            let bridge = JSPromiseBridge(completeChunk: completeChunk)
            
            // Weird issues with binding. Only solution I could find was to write
            // a function in JS that will do the binding for us.
            
            let bind = jsPromise.context.objectForKeyedSubscript("__bind")
            
            let boundThen = bind.callWithArguments([jsPromise, "then"])
            let boundCallback = bind.callWithArguments([bridge, "jsSuccess"])
            let boundFailure = bind.callWithArguments([bridge, "jsFailure"])


            
            boundThen.callWithArguments([boundCallback])
            boundThen.callWithArguments([JSValue(undefinedInContext: jsPromise.context), boundFailure])
            

        }
    }

}
