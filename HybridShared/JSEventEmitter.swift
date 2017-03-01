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
    func __JS__addEventListener(name: String, withJSFunc:JSValue)
    
    @objc(removeEventListener::)
    func removeEventListener(_ name: String, withJSFunc:JSValue)
    
//    @objc(dispatchEvent:)
//    func dispatchEvent(ev: JSEvent)
}


@objc open class JSEventEmitter : NSObject, JSEventEmitterExports {
    
//    typealias SwiftFunction = 
  
    fileprivate var jsListeners = [String: Set<JSValue>]()
    fileprivate var swiftListeners = [String: Set<NSObject>]()
    
    var typeListenerDictionary = [String: Any.Type]()
    
    @objc(addEventListener::)
    public func __JS__addEventListener(name: String, withJSFunc: JSValue) {
        if self.jsListeners[name] == nil {
            self.jsListeners[name] = Set<JSValue>()
        }
        
        self.jsListeners[name]!.insert(withJSFunc)
    }
    


    public func addEventListener<T:JSEvent>(_ type: T.Type, withJSFunc:JSValue) {
        
        self.__JS__addEventListener(name: T.type, withJSFunc: withJSFunc)
        
    }
    
    fileprivate func addEventListener<T:JSEvent>(_ name: String, withSwiftFunc: @escaping (T) -> Void) -> Listener<T> {
        
        let listener = Listener(withSwiftFunc)
        
        if self.swiftListeners[name] == nil {
            self.swiftListeners[name] = Set<Listener<JSEvent>>()
        }
        
        self.swiftListeners[name]!.insert(listener)
        
        return listener
        
    }
    

    public func addEventListener<T:JSEvent>(_ withSwiftFunc: @escaping (T) -> Void) -> Listener<T> {
        return addEventListener(T.type, withSwiftFunc: withSwiftFunc)
    }
    
    @objc(removeEventListener::)
    public func removeEventListener(_ name: String, withJSFunc:JSValue) {
        
        _ = self.jsListeners[name]?.remove(withJSFunc)
        
    }
    
    public func removeEventListener<T:JSEvent>(_ listener: Listener<T>) {
        self.swiftListeners[T.type]!.remove(listener)
    }
    
//    @objc(dispatchEvent:)
    public func dispatchEvent<T:JSEvent>(_ ev:T) {
        
        self.jsListeners[ev.type]?.forEach { $0.call(withArguments: [ev]) }
        self.swiftListeners[ev.type]?.forEach { swiftListener in
            
            if let listenerIsThisType = swiftListener as? Listener<T> {
                listenerIsThisType.funcToCall!(ev)
            }

        }
        

    }
    
}
