//
//  JSPromise.swift
//  hybrid
//
//  Created by alastair.coote on 18/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol JSPromiseExports: JSExport {
    
    @objc(then::)
    func then(resolve:JSValue, reject: JSValue?) -> JSValue
    
    @objc(catch:)
    func jscatch (reject: JSValue) -> JSValue
}


/// This is a wrapper around whatever ES6-compatible Promise implementation exists
/// in the worker context (it must have one). When paired with PromiseToJSPromise, it
/// allows us to (relatively) seamlessly transfer from native async to JS async.
@objc class JSPromise : NSObject, JSPromiseExports {
    
    typealias Resolver = (_:JSValue, _: JSValue?) -> JSValue
    typealias Rejector = (_: JSValue) -> JSValue
    
    /// Grabbed in the grabResolveAndRejectFromPromise function, this is the JS function
    /// for resolving our promise
    var jsResolveFunction:JSValue?
    
    /// Grabbed in the grabResolveAndRejectFromPromise function, this is the JS function
    /// for rejecting our promise
    var jsRejectFunction:JSValue?
    
    
    /// This is the 'then' function of our JS promise, bound to the promise (otherwise
    /// execution fails, it appears callWithArguments() doesn't respect bindings)
    var jsThenFunction:JSValue?
    
    /// This is the 'catch' function of our JS promise, bound to the promise (otherwise
    /// execution fails, it appears callWithArguments() doesn't respect bindings)
    var jsCatchFunction:JSValue?
    
    var context:JSContext?
    
    
    /// It is possible for a promise to resolve before a .then() is attached to it. If
    /// that is the case, we need to note it and immediately fire when .then() or .catch()
    /// are run.
    var hasResponded = false
    
    
    /// We store the resolve value in case the promise has resolved before .then() is called
    var resolveValue:AnyObject?
    
    
    /// We store the reject value in case the promise has rejected before .catch() is called
    var rejectError:ErrorType?
    
    
    /// This function is passed into the new Promise() constructor, allowing us to grab
    /// and store the resolve and reject functions
    ///
    /// - Parameters:
    ///   - resolve: The resolve function generated by the Promise library
    ///   - reject: The reject function generated by the Promise library
    private func grabResolveAndRejectFromPromise(resolve: JSValue, reject: JSValue) {
        self.jsResolveFunction = resolve
        self.jsRejectFunction = reject
    }
    
    
    /// Called on the native side - this takes our resolution value and sends it through
    /// to the JS promise.
    ///
    /// - Parameter withObj: The object to resolve with. Must convert to AnyObject, or be nil.
    func resolve(withObj: AnyObject?) {
        self.hasResponded = true
        self.resolveValue = withObj
        if withObj != nil {
            self.jsResolveFunction?.callWithArguments([withObj!])
        } else {
            self.jsResolveFunction?.callWithArguments([])
        }
    }
    
    
    /// Called on the native side - takes an ErrorType generated by native code, and creates
    /// a JS error with the string value of this error. Then passes it to our reject function.
    ///
    /// - Parameter withError: The error to send back to the JS context
    func reject(withError: ErrorType) {
        self.hasResponded = true
        self.rejectError = withError
        
        let err = JSValue(newErrorFromMessage: String(withError), inContext: self.jsRejectFunction!.context)
        
        self.jsRejectFunction?.callWithArguments([err])
    }
    
    
    /// When then() or catch() is called, it's the first time we have a reference to the JSContext we're running
    /// in. So, grab that context, create a JS promise and store the JS-side resolve() and reject() functions for
    /// future use. Also, bind and store the JS promise then() and catch() internally, so we can return them, basically
    /// making the native side of this invisible to JS, which is now dealing with a "normal" Promise.
    ///
    /// - Parameter contextProvider: The JSValue that can give us a JSContext. Is a function that was provided in then() or catch()
    private func contextCheck(contextProvider: JSValue) {
        
        if self.context != nil {
            return
        }
        
        self.context = contextProvider.context
        
        // From: http://nshipster.com/javascriptcore/ - we need to cast our function as AnyObject before we can pass it
        // back into JSContext
        
        let grabFunctionAsConvention: @convention(block) (JSValue, JSValue) -> () = self.grabResolveAndRejectFromPromise
        
        let promiseInstance = self.context!
            .objectForKeyedSubscript("Promise")
            .constructWithArguments([unsafeBitCast(grabFunctionAsConvention, AnyObject.self)])
        
        // I have no idea why this is required, but we can't call bind() directly from Swift - it results
        // in a type error. Maybe we need to bind the bind function, which... anyway, this quick function
        // allows us to bind out then and catch functions, to call them later without issues.
        
        let bindFunc = self.context!
            .objectForKeyedSubscript("Function")
            .constructWithArguments(["obj", "funcName", "return obj[funcName].bind(obj)"])
        
        self.jsThenFunction = bindFunc.callWithArguments([promiseInstance, "then"])
        self.jsCatchFunction = bindFunc.callWithArguments([promiseInstance, "catch"])
        
        if self.hasResponded == true {
            if self.rejectError != nil {
                self.reject(self.rejectError!)
            } else {
                self.resolve(self.resolveValue)
            }
        }
        
    }
    
    
    @objc(then::)
    
    /// This wraps around the JS promise's then() function, allowing us to grab the JSContext() and store
    /// variables accordingly.
    ///
    /// - Parameters:
    ///   - resolve: The JS function to run on success
    ///   - reject: The function to run on error. ES6 promises allow both .then(func1).catch(func2) and .then(func1,func2)
    /// - Returns: The result of executing the JS promise's .then() function
    func then(resolve:JSValue, reject:JSValue?) -> JSValue {
        self.contextCheck(resolve)
        
        if reject == nil {
            return self.jsThenFunction!.callWithArguments([resolve])
        } else {
            return self.jsThenFunction!.callWithArguments([resolve, reject!])
        }
        
        
    }
    
    @objc(catch:)
    
    /// This wraps around the JS promise's catch() function, allowing us to grab the JSContext() and store
    /// variables accordingly. 'catch' is a reserved word in Swift, so we call it jscatch, but export to
    /// Objective C (and, so, JS) as catch.
    ///
    /// - Parameters:
    ///   - reject: The function to run on error.
    /// - Returns: The result of executing the JS promise's .catch() function
    func jscatch(reject:JSValue) -> JSValue {
        self.contextCheck(reject)
        return self.jsCatchFunction!.callWithArguments([reject])
    }

    
    /// Quick utility function to match Promise.resolve() in JS
    static func resolve(val:AnyObject?) -> JSPromise {
        let promise = JSPromise()
        promise.resolve(val)
        return promise
    }
    
}