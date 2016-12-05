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
    static func pass(jsPromise:JSValue) -> Promise<Void> {
       return Promise<Void> { fulfill, reject in
            
            let rejectConverter = { (err:JSValue) in
                reject(JSContextError(jsValue: err))
            }
            
            let fulfillAsConvention: @convention(block) () -> () = fulfill
            let rejectAsConvention: @convention(block) (JSValue) -> () = rejectConverter
        
            let bindFunc = jsPromise.context
                .objectForKeyedSubscript("Function")
                .constructWithArguments(["obj", "funcName", "return obj[funcName].bind(obj)"])
            
            let then = bindFunc.callWithArguments([jsPromise, "then"])
            
            then.callWithArguments([unsafeBitCast(fulfillAsConvention, AnyObject.self), unsafeBitCast(rejectAsConvention, AnyObject.self)])

        }
    }
}
