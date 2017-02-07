//
//  EventEmitter.swift
//  hybrid
//
//  Created by alastair.coote on 29/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

public class Listener<T> : NSObject {
    
    public typealias ListenerFunction = (T) -> Void
    
    var funcToCall: ListenerFunction?
    
    public init(_ funcToCall: @escaping ListenerFunction) {
        self.funcToCall = funcToCall
    }
    
    override init() {
        
    }
    
}

public class EventEmitter <T:Any> {
    
    public typealias ListenerFunction = (T) -> Void
    
    var listeners = [String: Set<Listener<T>>]()
    
    public func on(_ name:String, _ listener: @escaping ListenerFunction) -> Listener<T> {
        
        let wrapper = Listener(listener)
        
        self.on(name:name, listener: wrapper)
        
        return wrapper
    }
    
    public init() {
        
    }
    
    private func on(name:String, listener: Listener<T>) {
        if listeners[name] == nil {
            listeners[name] = [listener]
        } else {
            listeners[name]!.insert(listener)
        }
    }
    
    public func once(_ name: String, _ listenerFunction: @escaping ListenerFunction) {
        
        let wrapper = Listener<T>()
        
        let selfDestructingListener = { (obj: T) in
            listenerFunction(obj)
            self.off(name, wrapper)
        }
        
        wrapper.funcToCall = selfDestructingListener
        
        self.on(name: name, listener: wrapper)
        
    }
    
    public func off(_ name:String, _ listener: Listener<T>) {
        
        let removedItem = self.listeners[name]?.remove(listener)
        
        if removedItem == nil {
            log.warning("No existing listener when trying to remove listener")
        }
        
    }
    
    public func emit(_ name:String, _ object: T) {
        
        if self.listeners[name] == nil {
            return
        }
        
        self.listeners[name]!.forEach { $0.funcToCall!(object) }
    }
}

