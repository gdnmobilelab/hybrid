//
//  JSPromise.swift
//  ServiceWorker
//
//  Created by alastair.coote on 23/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

class JSPromise {
    
    let context:JSContext
    fileprivate var fulfill:JSManagedValue?
    fileprivate var reject:JSManagedValue?
    fileprivate var promiseJSValue:JSManagedValue?
    
    public init(context:JSContext) {
        self.context = context
        
        let capture: @convention(block) (JSValue, JSValue) -> Void = { (fulfillVal:JSValue, rejectVal:JSValue) in
            
            let fulfillManaged = JSManagedValue(value: fulfillVal)
            let rejectManaged = JSManagedValue(value: rejectVal)
            
            self.context.virtualMachine.addManagedReference(fulfillManaged, withOwner: self)
            self.context.virtualMachine.addManagedReference(rejectManaged, withOwner: self)
            
            self.fulfill = fulfillManaged
            self.reject = rejectManaged
            
        }
        
        let val = self.context.objectForKeyedSubscript("Promise")!.construct(withArguments: [unsafeBitCast(capture, to: AnyObject.self)])
        self.promiseJSValue = JSManagedValue(value: val)
        self.context.virtualMachine.addManagedReference(self.jsValue, withOwner: self)
    }
    
    public var jsValue: JSValue {
        get {
            return self.promiseJSValue!.value
        }
    }
    
    deinit {
        self.context.virtualMachine.removeManagedReference(self.fulfill, withOwner: self)
        self.context.virtualMachine.removeManagedReference(self.reject, withOwner: self)
        self.context.virtualMachine.removeManagedReference(self.jsValue, withOwner: self)
    }
    
    public func fulfill(_ value: Any) {
        self.fulfill!.value.call(withArguments: [value])
    }
    
    public func reject(_ error: Error) {
        
        var str = String(describing: error)
        if let errMsg = error as? ErrorMessage {
            str = errMsg.message
        }
        
        let err = JSValue(newErrorFromMessage: str, in: self.context)
        
        self.reject!.value.call(withArguments: [err!])
    }
    
}