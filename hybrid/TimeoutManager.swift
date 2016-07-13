//
//  TimeoutManager.swift
//  hybrid
//
//  Created by alastair.coote on 12/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore


class ServiceWorkerTimeoutManager {
    
    var lastTimeoutIndex:Int32 = -1
    var cancelledTimeouts = Set<Int32>()
    
    
    func hookFunctions(jsContext:JSContext) {
        let setTimeoutConvention: @convention(block) (JSValue, JSValue) -> Int32 = self.setTimeout
        jsContext.setObject(unsafeBitCast(setTimeoutConvention, AnyObject.self), forKeyedSubscript: "setTimeout")
        
        let clearTimeoutConvention: @convention(block) (JSValue) -> Void = self.clearTimeout
        jsContext.setObject(unsafeBitCast(clearTimeoutConvention, AnyObject.self), forKeyedSubscript: "clearTimeout")
    }
    
    func setTimeout(callback:JSValue, timeout: JSValue) -> Int32 {
        
        lastTimeoutIndex += 1
        
        let thisTimeoutIndex = lastTimeoutIndex
        
        // turns out you can call setTimeout with undefined and it'll execute
        // immediately. So we need to handle that.
        
        var timeoutInt:Double = 0;
        if timeout.isNumber {
            timeoutInt = timeout.toDouble()
            
        }
        dispatch_after(
            dispatch_time(
                DISPATCH_TIME_NOW,
                Int64((timeoutInt / 1000) * Double(NSEC_PER_SEC))
            ),
            dispatch_get_main_queue(), {
                
                if self.cancelledTimeouts.contains(thisTimeoutIndex) == true {
                    self.cancelledTimeouts.remove(thisTimeoutIndex)
                    return
                } else {
                    callback.callWithArguments(nil)
                }
                
        })
        
        return thisTimeoutIndex
        
    }
    
    func clearTimeout(index:JSValue) {
        self.cancelledTimeouts.insert(index.toInt32())
    }
}