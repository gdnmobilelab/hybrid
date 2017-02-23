//
//  ServiceWorkerRegistration.swift
//  hybrid
//
//  Created by alastair.coote on 09/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker
import HybridShared
import PromiseKit

class ServiceWorkerRegistration: ServiceWorkerRegistrationProtocol {
    
    let scope: URL
    let scriptURL: URL
    let manager: ServiceWorkerManager
    var updateListener: Listener<ServiceWorkerInstanceBridge>?
    
    init(scope: URL, scriptURL: URL, manager: ServiceWorkerManager) {
        self.scope = scope
        self.scriptURL = scriptURL
        self.manager = manager
//        self.updateListener = self.manager.lifecycleEvents.on("statechange", self.receiveWorkerUpdate)
    }
    
    var active: ServiceWorkerInstance?
    var waiting: ServiceWorkerInstance?
    var installing: ServiceWorkerInstance?
    
    func showNotification(_ title: String, options: NotificationShowOptions?) -> Promise<Void> {
        return Promise(value:())
    }
    
    func getNotifications(_ options: NotificationGetOptions?) -> Promise<[HybridNotification]> {
        return Promise(value: [])
    }
    
    func update() -> Promise<Void> {
        return self.manager.update(url: self.scriptURL, scope: self.scope)
    }
    
//    fileprivate func clearWorkerFromAllInstances(worker: ServiceWorkerInstance) {
//        
//        if self.active == worker {
//            self.active = nil
//        }
//        
//        if self.waiting == worker {
//            self.waiting = nil
//        }
//        
//        if self.installing == worker {
//            self.installing = nil
//        }
//        
//    }
    
    
    /// As the manager alters the state of workers, we need to reflect this in our
    /// ServiceWorkerRegistration instance
    ///
    /// - Parameter bridge: The bridge with the state that changed
//    fileprivate func receiveWorkerUpdate(bridge: ServiceWorkerInstanceBridge) {
//        
//        if bridge.registration.scope != self.scope {
//            // If it isn't the same scope as this registration, we can safely ignore it
//            return
//        }
//        
//        // Otherwise, update our worker collection accordingly. A worker should only
//        // occupy one slot, so we clear it out from any existing ones before placing it
//        // in the new slot.
//        
//        let newState = bridge.instance.installState
//        let newInstance = bridge.instance
//        
//        if newState == .redundant {
//            
//            clearWorkerFromAllInstances(worker: newInstance)
//            
//        } else if newState == .activated && self.active != newInstance {
//            
//            clearWorkerFromAllInstances(worker: newInstance)
//            self.active = newInstance
//            
//        } else if newState == .installed && self.waiting != newInstance {
//            
//            clearWorkerFromAllInstances(worker: newInstance)
//            self.waiting = newInstance
//            
//        } else if newState == .installing && self.installing != newInstance {
//            
//            clearWorkerFromAllInstances(worker: newInstance)
//            self.installing = newInstance
//            
//        }
//        
//        
//    }
}
