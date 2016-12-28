//
//  TimeoutManager.swift
//  hybrid
//
//  Created by alastair.coote on 12/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

struct Interval {
    var timeout: Double
    var function: JSValue
    var timeoutIndex: Int
}

/// JSContext has no built-in support for setTimeout, setInterval, etc. So we need to manually
/// add that support into the context. All public methods are exactly as you'd expect.
@objc class ServiceWorkerTimeoutManager : NSObject {
    
    var lastTimeoutIndex:Int = -1
    
    
    /// Couldn't find an easy way to cancel a dispatch_after, so instead, when the dispatch completes
    /// we check this array to see if the timeout has been cancelled. If it has, we don't run the
    /// corresponding JS function.
    var cancelledTimeouts = Set<Int>()
    
    func hookFunctions(_ jsContext:JSContext) {
        
        let setTimeoutConvention: @convention(block) (JSValue, JSValue) -> Int = self.setTimeout
        let setIntervalConvention: @convention(block) (JSValue, JSValue) -> Int = self.setInterval
        let clearTimeoutConvention: @convention(block) (Int) -> Void = self.clearTimeout
        let clearIntervalConvention: @convention(block) (Int) -> Void = self.clearInterval
        
        jsContext.setObject(unsafeBitCast(setTimeoutConvention, to: AnyObject.self), forKeyedSubscript: "setTimeout" as (NSCopying & NSObjectProtocol)!)
        jsContext.setObject(unsafeBitCast(setIntervalConvention, to: AnyObject.self), forKeyedSubscript: "setInterval" as (NSCopying & NSObjectProtocol)!)
        jsContext.setObject(unsafeBitCast(clearTimeoutConvention, to: AnyObject.self), forKeyedSubscript: "clearTimeout" as (NSCopying & NSObjectProtocol)!)
        jsContext.setObject(unsafeBitCast(clearIntervalConvention, to: AnyObject.self), forKeyedSubscript: "clearInterval" as (NSCopying & NSObjectProtocol)!)
    }
    
    func setInterval(_ callback:JSValue, interval: JSValue) -> Int {
        
        lastTimeoutIndex += 1
        
        let intervalNumber = self.jsValueMaybeNullToDouble(interval)
        
        let interval = Interval(timeout: intervalNumber, function: callback, timeoutIndex: lastTimeoutIndex)
        
        self.fireInterval(interval)
        
        return lastTimeoutIndex
        
    }
    
    fileprivate func fireInterval(_ interval: Interval) {
        
        DispatchQueue.main.asyncAfter(
            deadline: DispatchTime.now() + Double(Int64((interval.timeout / 1000) * Double(NSEC_PER_SEC))) / Double(NSEC_PER_SEC), execute: {
                
                if self.cancelledTimeouts.contains(interval.timeoutIndex) == true {
                    self.cancelledTimeouts.remove(interval.timeoutIndex)
                    return
                } else {
                    interval.function.call(withArguments: nil)
                    self.fireInterval(interval)
                }
                
        })

    }
    
    func clearInterval(_ index:Int) {
        self.clearTimeout(index)
    }
    
    fileprivate func jsValueMaybeNullToDouble(_ val:JSValue) -> Double {
        
        var timeout:Double = 0
        
        if val.isNumber {
            timeout = val.toDouble()
        }
        
        return timeout
    }
    
    func setTimeout(_ callback:JSValue, timeout: JSValue) -> Int {
        
        lastTimeoutIndex += 1
        
        let thisTimeoutIndex = lastTimeoutIndex
        
        // turns out you can call setTimeout with undefined and it'll execute
        // immediately. So we need to handle that.
        
     
        DispatchQueue.main.asyncAfter(
            deadline: DispatchTime.now() + Double(Int64((self.jsValueMaybeNullToDouble(timeout) / 1000) * Double(NSEC_PER_SEC))) / Double(NSEC_PER_SEC), execute: {
                
                if self.cancelledTimeouts.contains(thisTimeoutIndex) == true {
                    self.cancelledTimeouts.remove(thisTimeoutIndex)
                    return
                } else {
                    callback.call(withArguments: nil)
                }
                
        })
        
        return thisTimeoutIndex
        
    }
    
    func clearTimeout(_ index:Int) {
        self.cancelledTimeouts.insert(index)
    }
}
