//
//  TimeoutManager.swift
//  hybrid
//
//  Created by alastair.coote on 12/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol ServiceWorkerTimeoutManagerExports : JSExport {
    func setTimeout(callback:JSValue, timeout: JSValue) -> Int
    func clearTimeout(index:Int)
    func setInterval(callback:JSValue, interval: JSValue) -> Int
    func clearInterval(index:Int)
}

struct Interval {
    var timeout: Double
    var function: JSValue
    var timeoutIndex: Int
}


/// JSContext has no built-in support for setTimeout, setInterval, etc. So we need to manually
/// add that support into the context. All public methods are exactly as you'd expect.
@objc class ServiceWorkerTimeoutManager : NSObject, ServiceWorkerTimeoutManagerExports {
    
    var lastTimeoutIndex:Int = -1
    
    
    /// Couldn't find an easy way to cancel a dispatch_after, so instead, when the dispatch completes
    /// we check this array to see if the timeout has been cancelled. If it has, we don't run the
    /// corresponding JS function.
    var cancelledTimeouts = Set<Int>()
    
    func hookFunctions(jsContext:JSContext) {
        jsContext.setObject(self, forKeyedSubscript: "__timeoutManager")
    }
    
    func setInterval(callback:JSValue, interval: JSValue) -> Int {
        
        lastTimeoutIndex += 1
        
        let intervalNumber = self.jsValueMaybeNullToDouble(interval)
        
        let interval = Interval(timeout: intervalNumber, function: callback, timeoutIndex: lastTimeoutIndex)
        
        self.fireInterval(interval)
        
        return lastTimeoutIndex
        
    }
    
    private func fireInterval(interval: Interval) {
        
        dispatch_after(
            dispatch_time(
                DISPATCH_TIME_NOW,
                Int64((interval.timeout / 1000) * Double(NSEC_PER_SEC))
            ),
            dispatch_get_main_queue(), {
                
                if self.cancelledTimeouts.contains(interval.timeoutIndex) == true {
                    self.cancelledTimeouts.remove(interval.timeoutIndex)
                    return
                } else {
                    interval.function.callWithArguments(nil)
                    self.fireInterval(interval)
                }
                
        })

    }
    
    func clearInterval(index:Int) {
        self.clearTimeout(index)
    }
    
    private func jsValueMaybeNullToDouble(val:JSValue) -> Double {
        
        var timeout:Double = 0
        
        if val.isNumber {
            timeout = val.toDouble()
        }
        
        return timeout
    }
    
    
    func setTimeout(callback:JSValue, timeout: JSValue) -> Int {
        
        lastTimeoutIndex += 1
        
        let thisTimeoutIndex = lastTimeoutIndex
        
        // turns out you can call setTimeout with undefined and it'll execute
        // immediately. So we need to handle that.
        
     
        dispatch_after(
            dispatch_time(
                DISPATCH_TIME_NOW,
                Int64((self.jsValueMaybeNullToDouble(timeout) / 1000) * Double(NSEC_PER_SEC))
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
    
    func clearTimeout(index:Int) {
        self.cancelledTimeouts.insert(index)
    }
}
