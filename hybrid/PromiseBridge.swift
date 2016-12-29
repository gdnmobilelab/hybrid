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

//@objc protocol JSPromiseBridgeExports: JSExport {
//    func jsSuccess(_ success: JSValue) -> Void
//    func jsFailure(_ failure: JSValue) -> Void
//    
//}
//
//
///// A wrapper around JavaScript promises that allows us to hook into success and failure
///// when they are executed.
//@objc open class JSPromiseBridge: NSObject, JSPromiseBridgeExports {
//    
//    typealias CompleteFunc = (JSValue?, JSValue?) -> Void
//   
//    let completeFunc:CompleteFunc
//    
//    init(completeChunk: @escaping CompleteFunc) {
//        self.completeFunc = completeChunk
//    }
//    
//    open func jsSuccess(_ success: JSValue) {
//        self.completeFunc(success, nil)
//    }
//    
//    open func jsFailure(_ failure: JSValue) {
//        self.completeFunc(nil, failure)
//    }
//}


/// Wrap around a JS promise and turn into a PromiseKit promise. This needs some work.
//class PromiseBridge<T: NSObject> : Promise<T?> {
//    
//    init(jsPromise:JSValue) {
//        super.init { (fulfill, reject) in
//            
//            let completeChunk = { (success: JSValue?, failure:JSValue?) in
//                
//                if failure != nil {
//                    log.error(failure!.toString())
//                    reject(JSContextError(message: failure!.toString()))
//                    
//                } else {
//                    if success!.isUndefined || success!.isNull {
//                        fulfill(nil)
//                        return
//                    }
//                    log.debug("Converting " + success!.toString() + " to instance of " + String(describing: T.self))
//                    let convertedObject = success!.toObjectOf(T.self as AnyClass) as! T
//                    fulfill(convertedObject)
//                }
//                
//                
//            }
//            
//            let bridge = JSPromiseBridge(completeChunk: completeChunk)
//            
//            // Weird issues with binding. Only solution I could find was to write
//            // a function in JS that will do the binding for us.
//            
//            let bind = jsPromise.context.objectForKeyedSubscript("__bind")!
//            
//            let boundThen = bind.call(withArguments: [jsPromise, "then"])!
//            let boundCallback = bind.call(withArguments: [bridge, "jsSuccess"])!
//            let boundFailure = bind.call(withArguments: [bridge, "jsFailure"])!
//
//
//            
//            boundThen.call(withArguments: [boundCallback])
//            boundThen.call(withArguments: [JSValue(undefinedIn: jsPromise.context), boundFailure])
//            
//        }
//    }
//    
//    required init(resolvers: (@escaping (T) -> Void, @escaping (Error) -> Void) throws -> Void) {
//        fatalError("init(resolvers:) has not been implemented")
//    }
//    
//    required init(value: T) {
//        fatalError("init(value:) has not been implemented")
//    }
//
//}
