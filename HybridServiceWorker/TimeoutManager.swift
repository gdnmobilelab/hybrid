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
class TimeoutManager {
    
    var lastTimeoutIndex:Int = -1
    
    
    /// Couldn't find an easy way to cancel a dispatch_after, so instead, when the dispatch completes
    /// we check this array to see if the timeout has been cancelled. If it has, we don't run the
    /// corresponding JS function.
    var cancelledTimeouts = Set<Int>()
    
    var setTimeout:AnyObject {
        get {
            return unsafeBitCast((self.setTimeoutFunction as @convention(block) (JSValue, JSValue) -> Int), to: AnyObject.self)
        }
    }
    
    var setInterval:AnyObject {
        get {
            return unsafeBitCast((self.setIntervalFunction as @convention(block) (JSValue, JSValue) -> Int), to: AnyObject.self)
        }
    }
    
    var clearTimeout:AnyObject {
        get {
            return unsafeBitCast((self.clearTimeoutFunction as @convention(block) (Int) -> Void), to: AnyObject.self)
        }
    }
    
    var clearInterval:AnyObject {
        get {
            return unsafeBitCast((self.clearIntervalFunction as @convention(block) (Int) -> Void), to: AnyObject.self)
        }
    }
    
    fileprivate func setIntervalFunction(_ callback:JSValue, interval: JSValue) -> Int {
        
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
    
    fileprivate func clearIntervalFunction(_ index:Int) {
        self.clearTimeoutFunction(index)
    }
    
    fileprivate func jsValueMaybeNullToDouble(_ val:JSValue) -> Double {
        
        var timeout:Double = 0
        
        if val.isNumber {
            timeout = val.toDouble()
        }
        
        return timeout
    }
    
    fileprivate func setTimeoutFunction(_ callback:JSValue, timeout: JSValue) -> Int {
        
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
    
    fileprivate func clearTimeoutFunction(_ index:Int) {
        self.cancelledTimeouts.insert(index)
    }
}
