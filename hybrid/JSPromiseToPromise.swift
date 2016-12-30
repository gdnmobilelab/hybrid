//
//  JSPromiseToPromise.swift
//  hybrid
//
//  Created by alastair.coote on 29/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit

class JSPromiseToPromise<T> {
    static func pass(_ jsPromise:JSValue) -> Promise<Void> {
       return Promise<Void> { fulfill, reject in
            
            let rejectConverter = { (err:JSValue) in
                reject(JSContextError(jsValue: err))
            }
            
            let fulfillAsConvention: @convention(block) () -> () = fulfill
            let rejectAsConvention: @convention(block) (JSValue) -> () = rejectConverter
        
            let bindFunc = jsPromise.context
                .objectForKeyedSubscript("Function")
                .construct(withArguments: ["obj", "funcName", "return obj[funcName].bind(obj)"])!
        
            let then = bindFunc.call(withArguments: [jsPromise, "then"])!
        
            then.call(withArguments: [unsafeBitCast(fulfillAsConvention, to: AnyObject.self), unsafeBitCast(rejectAsConvention, to: AnyObject.self)])

        }
    }
}

extension JSPromiseToPromise where T: AnyObject {
    static func pass(_ jsPromise:JSValue) -> Promise<T?> {
        return Promise<T?> { fulfill, reject in
            
            let rejectConverter = { (err:JSValue) in
                reject(JSContextError(jsValue: err))
            }
            
            let fulfillAsConvention: @convention(block) (JSValue) -> () = { jsVal in
                
                var result:T? = nil
                
                if jsVal.isUndefined == false && jsVal.isNull == false {
                    result = (jsVal.toObjectOf(T.self) as! T)
                }
                
                fulfill(result)
            }
            
            let rejectAsConvention: @convention(block) (JSValue) -> () = rejectConverter
            
            let bindFunc = jsPromise.context
                .objectForKeyedSubscript("Function")
                .construct(withArguments: ["obj", "funcName", "return obj[funcName].bind(obj)"])!
            
            let then = bindFunc.call(withArguments: [jsPromise, "then"])!
            
            then.call(withArguments: [unsafeBitCast(fulfillAsConvention, to: AnyObject.self), unsafeBitCast(rejectAsConvention, to: AnyObject.self)])
            
        }
    }

}
