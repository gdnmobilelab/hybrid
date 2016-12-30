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
    
    let data:Data
    
    init(data:Data) {
        self.data = data
    }
    
    func convertToArrayBuffer(_ context:JSContext) {
        let count = self.data.count / MemoryLayout<UInt32>.size
        var array = [UInt32](repeating: 0, count: count)
        (self.data as NSData).getBytes(&array, length:count * MemoryLayout<UInt32>.size)
        
        let arrayBuffer = context.objectForKeyedSubscript("ArrayBuffer")
            .construct(withArguments: [self.data.count])!
        
        let uIntArray = context.objectForKeyedSubscript("Uint32Array")
            .construct(withArguments: [arrayBuffer])!
        
        var idx = 0
        while idx < array.count {
            let jv = JSValue(uInt32: array[idx], in: context)
            uIntArray.setObject(jv, atIndexedSubscript: idx)
            idx = idx + 1
        }
        
        self.resolveValue = arrayBuffer
        self.hasResponded = true
        
    }
    
    override func then(_ resolve: JSValue, reject: JSValue?) -> JSValue {
        self.convertToArrayBuffer(resolve.context)
        return super.then(resolve, reject: reject)
    }
}
