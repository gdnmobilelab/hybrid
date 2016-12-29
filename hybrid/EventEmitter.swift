//
//  EventEmitter.swift
//  hybrid
//
//  Created by alastair.coote on 29/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class Listener<T> : NSObject {
    
    typealias ListenerFunction = (T) -> Void
    
    var funcToCall: ListenerFunction?
    
    init(_ funcToCall: @escaping ListenerFunction) {
        self.funcToCall = funcToCall
    }
    
    override init() {
        
    }
}

class EventEmitter <T:Any> {
    
    typealias ListenerFunction = (T) -> Void
    
    var listeners = [String: Set<Listener<T>>]()
    
    func on(_ name:String, _ listener: @escaping ListenerFunction) -> Listener<T> {
        
        let wrapper = Listener(listener)
        
        self.on(name:name, listener: wrapper)
        
        return wrapper
    }
    
    private func on(name:String, listener: Listener<T>) {
        if listeners[name] == nil {
            listeners[name] = [listener]
        } else {
            listeners[name]!.insert(listener)
        }
    }
    
    func once(_ name: String, _ listenerFunction: @escaping ListenerFunction) {
        
        let wrapper = Listener<T>()
        
        let selfDestructingListener = { (obj: T) in
            listenerFunction(obj)
            self.off(name, wrapper)
        }
        
        wrapper.funcToCall = selfDestructingListener
        
        self.on(name: name, listener: wrapper)
        
    }
    
    func off(_ name:String, _ listener: Listener<T>) {
        
        let removedItem = self.listeners[name]?.remove(listener)
        
        if removedItem == nil {
            log.warning("No existing listener when trying to remove listener")
        }
        
    }
    
    func emit(_ name:String, _ object: T) {
        
        if self.listeners[name] == nil {
            return
        }
        
        self.listeners[name]!.forEach { $0.funcToCall!(object) }
    }
}
