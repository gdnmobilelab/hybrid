//
//  ServiceWorkerInstance.swift
//  hybrid
//
//  Created by alastair.coote on 08/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit

class JSContextError : ErrorType {
    let message:String
    init(message:String){
        self.message = message
    }}

struct PromiseReturn {
    let fulfill:(JSValue) -> Void
    let reject:(ErrorType) -> Void
}

public class ServiceWorkerInstance {
    
    var jsContext:JSContext!
    var contextErrorValue:JSValue?
    
    var pendingPromises = Dictionary<Int, PromiseReturn>()
    
    init() {
        self.jsContext = JSContext()
        self.jsContext.exceptionHandler = self.exceptionHandler
        self.hookFunctions()
        
    }
    
    private func hookFunctions() {
        
        let promiseCallbackAsConvention: @convention(block) (JSValue, JSValue, JSValue) -> Void = self.promiseCallback
        self.jsContext.setObject(unsafeBitCast(promiseCallbackAsConvention, AnyObject.self), forKeyedSubscript: "__promiseCallback")
        
        let setTimeout: @convention(block) (JSValue, JSValue) -> Void = self.setTimeout
        self.jsContext.setObject(unsafeBitCast(setTimeout, AnyObject.self), forKeyedSubscript: "setTimeout")
        
    }
    
    
    private func promiseCallback(pendingIndex: JSValue, error: JSValue, response: JSValue) {
        let pendingIndexAsInt = Int(pendingIndex.toInt32())
        if (error.isNull == false) {
            pendingPromises[pendingIndexAsInt]?.reject(JSContextError(message: error.toString()))
        } else {
            pendingPromises[pendingIndexAsInt]?.fulfill(response)
        }
        pendingPromises.removeValueForKey(pendingIndexAsInt)
    }
    
    func executeJSPromise(js:String) -> Promise<JSValue> {
        
        // We can't use an array because we need the indexes to stay consistent even
        // when an entry has been removed. So instead we check every index until we
        // find an empty one, then use that.
        
        var pendingIndex = 0
        while pendingPromises[pendingIndex] != nil {
            pendingIndex += 1
        }
        
        return Promise<JSValue> { fulfill, reject in
            pendingPromises[pendingIndex] = PromiseReturn(fulfill: fulfill, reject: reject)
            self.runScript("self.promiseBridge(" + String(pendingIndex) + "," + js + ");")
            .error { err in
                reject(err)
            }
        }
    }
    
    func loadServiceWorker(workerJS:String) -> Promise<JSValue> {
        return self.loadContextScript()
        .then {_ in 
            self.runScript(workerJS)
        }
    }
    
    func setTimeout(callback:JSValue, timeout: JSValue) {
        dispatch_after(
            dispatch_time(
                DISPATCH_TIME_NOW,
                Int64((timeout.toDouble() / 1000) * Double(NSEC_PER_SEC))
            ),
            dispatch_get_main_queue(), {
                callback.callWithArguments(nil)
        })
        
    }
    
    private func loadContextScript() -> Promise<JSValue> {
        
        return Promise<String> {fulfill, reject in
            let workerContextPath = NSBundle.mainBundle().pathForResource("worker-context", ofType: "js", inDirectory: "js-dist")!
            let contextJS = try NSString(contentsOfFile: workerContextPath, encoding: NSUTF8StringEncoding) as String
            fulfill(contextJS)
        }.then { js in
            return self.runScript("var self = {};" + js)
        }
    }
    
    func runScript(js: String) -> Promise<JSValue> {
        self.contextErrorValue = nil
        return Promise<JSValue> { fulfill, reject in
            let result = self.jsContext.evaluateScript(js)
            if (self.contextErrorValue != nil) {
                let errorText = self.contextErrorValue!.toString()
                reject(JSContextError(message:errorText))
            } else {
                fulfill(result)
            }
        }
    }
    
    
    func exceptionHandler(context:JSContext!, exception:JSValue!) {
        self.contextErrorValue = exception
        log.error("JSCONTEXT error: " + exception.toString())
    }
}