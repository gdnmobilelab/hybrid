//
//  ArrayBufferJSPromise.swift
//  hybrid
//
//  Created by alastair.coote on 21/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore


/// Super weird requirement, but we can only create an ArrayBuffer inside a JSContext.
/// We need a reference to a context to go forward, so we have to wrap it in a promise.
class ArrayBufferJSPromise : JSPromise {
    
    let data:NSData
    
    init(data:NSData) {
        self.data = data
    }
    
    func convertToArrayBuffer(context:JSContext) {
        let count = self.data.length / sizeof(UInt32)
        var array = [UInt32](count: count, repeatedValue: 0)
        self.data.getBytes(&array, length:count * sizeof(UInt32))
        
        let arrayBuffer = context.objectForKeyedSubscript("ArrayBuffer")
            .constructWithArguments([self.data.length])
        
        let uIntArray = context.objectForKeyedSubscript("Uint32Array")
            .constructWithArguments([arrayBuffer])
        
        var idx = 0
        while idx < array.count {
            let jv = JSValue(UInt32: array[idx], inContext: context)
            uIntArray.setObject(jv, atIndexedSubscript: idx)
            idx = idx + 1
        }
        
        self.resolveValue = arrayBuffer
        self.hasResponded = true
        
    }
    
    override func then(resolve: JSValue, reject: JSValue?) -> JSValue {
        self.convertToArrayBuffer(resolve.context)
        return super.then(resolve, reject: reject)
    }
}
