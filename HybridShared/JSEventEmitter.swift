//
//  JSEventEmitter.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc public protocol JSEventEmitterExports : JSExport {
    
    @objc(addEventListener::)
    func addJSEventListener(name: String, funcToRun:JSValue)
    
    @objc(removeEventListener::)
    func removeJSEventListener(name: String, funcToRun:JSValue)
    
    @objc(dispatchEvent:)
    func dispatchJSEvent(ev: JSEvent)
}

fileprivate class JsFuncWrapper: Hashable {
    
    let jsVal: JSValue
    let listener: Listener<JSEvent>
    
    var hashValue: Int {
        get {
            return jsVal.hashValue
        }
    }
    
    init(_ jsVal: JSValue, listener: Listener<JSEvent>) {
        
        self.jsVal = jsVal
        self.listener = listener
        
    }
    
    public static func ==(lhs: JsFuncWrapper, rhs: JsFuncWrapper) -> Bool {
        return lhs.hashValue == rhs.hashValue
    }
    
}

@objc open class JSEventEmitter : NSObject, JSEventEmitterExports {
    

    let jsEvents = EventEmitter<JSEvent>()
    
    fileprivate func runJSFunc(_ funcToRun: JSValue) -> ((JSEvent) -> Void) {
        
        return { (emitVal:JSEvent) -> Void in
            
            funcToRun.call(withArguments: [emitVal])
            
        }
        
    }
    
    fileprivate var allListeners = Set<JsFuncWrapper>()
    
    @objc(addEventListener::)
    public func addJSEventListener(name: String, funcToRun:JSValue) {
        
        let listener = self.jsEvents.on(name, self.runJSFunc(funcToRun))
        
        allListeners.insert(JsFuncWrapper(funcToRun, listener: listener))
        
    }
    
    @objc(removeEventListener::)
    public func removeJSEventListener(name: String, funcToRun:JSValue) {
        
        let existingWrapper = self.allListeners.filter { $0.jsVal == funcToRun }.first
        
        if let wrapper = existingWrapper {
            
            self.jsEvents.off(name, wrapper.listener)
            self.allListeners.remove(wrapper)
            
        }
        
    }
    
    @objc(dispatchEvent:)
    public func dispatchJSEvent(ev:JSEvent) {
        self.jsEvents.emit(ev.type, ev)
    }
    
}
