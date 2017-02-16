//
//  ServiceWorkerRegistration.swift
//  hybrid
//
//  Created by alastair.coote on 16/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import HybridServiceWorker


/// The ServiceWorkerRegistration is the bridge between the container and the worker
/// itself. One registration can be shared between different containers.
class ServiceWorkerRegistration : NSObject, HybridMessageReceiver {
    
    let jsClassName = "ServiceWorkerRegistration"
    
    let containers = Set<ServiceWorkerContainer>()
    
    let scope:URL
    
    init(scope: URL) {
        self.scope = scope
    }
    
    fileprivate var _active: ServiceWorkerInstance?
    fileprivate var _waiting: ServiceWorkerInstance?
    fileprivate var _installing: ServiceWorkerInstance?
    fileprivate var _redundant: ServiceWorkerInstance?
    
    var active:ServiceWorkerInstance? {
        
        get {
            return self._active
        }
        
        set(value) {
            self._active = value
        }
        
    }
    
    var installing:ServiceWorkerInstance? {
        
        get {
            return self._installing
        }
        
        set(value) {
            self._installing = value
        }
        
    }
    
    var waiting:ServiceWorkerInstance? {
        
        get {
            return self._waiting
        }
        
        set(value) {
            self._waiting = value
        }
        
    }
    
    var redundant:ServiceWorkerInstance? {
        
        get {
            return self._redundant
        }
        
        set(value) {
            self._redundant = value
        }
        
    }
    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>? {
        return nil
    }
    
    
    
    
    func getInitialData() -> Any? {
        return nil
    }
    
}
