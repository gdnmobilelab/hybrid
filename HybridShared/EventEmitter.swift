//
//  EventEmitter.swift
//  hybrid
//
//  Created by alastair.coote on 29/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


/// Our generic event emitter. Allows subscriptions based on the class of event being emitted.
//public class EventEmitter {
//    
//    public init() {
//        
//    }
//    
//    fileprivate var listeners = Set<NSObject>()
//    
//    
//    public func on<T>(_ listenerFunction: @escaping (T) -> Void) -> Listener<T> {
//        
//        let wrapper = Listener(listenerFunction)
//        self.listeners.insert(wrapper)
//        
//        return wrapper
//        
//    }
//    
//    public func off<T>(_ listener: Listener<T>) {
//        
//        if self.listeners.contains(listener) == false {
//            log.warning("Tried to remove an event listener that was not attached")
//        }
//        
//        self.listeners.remove(listener)
//    }
//    
//    public func once<T>(_ listenerFunction: @escaping (T) -> Void) {
//        
//        let wrapper = Listener<T>()
//        
//        let selfDestructingListener = { (obj: T) in
//            listenerFunction(obj)
//            self.off(wrapper)
//        }
//        
//        wrapper.funcToCall = selfDestructingListener
//        
//        self.listeners.insert(wrapper)
//    }
//    
//    public func emit<T>(_ object: T) {
//        
//        self.listeners.forEach { listener in
//            if let thisType = listener as? Listener<T> {
//                thisType.funcToCall!(object)
//            }
//        }
//        
//    }
//    
//}


public class Listener<T> : NSObject {
    
    public typealias ListenerFunction = (T) -> Void
    
    /// Has to be optional as we assign after init when using a self-destructing listener
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

