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
import HybridShared
import HybridWorkerManager


/// The ServiceWorkerRegistration is the bridge between the container and the worker
/// itself. A registration represents a scope, but we can have multiple instances for the same
/// scope, in order to retain a 1:1 connection between webviews and their native proxies.
class ServiceWorkerRegistration : NSObject, HybridMessageReceiver {
    
    fileprivate var associatedContainers = Set<ServiceWorkerContainer>()
    fileprivate var managerListener: Listener<ServiceWorkerEvent>?
    
    let workerManager:ServiceWorkerManager
    
    internal func getArgumentsForJSMirror() throws -> [Any?] {
        return [self.scope.absoluteString]
    }
    
    internal static func createFromJSArguments(args: [Any?], from manager: HybridMessageManager) throws -> HybridMessageReceiver {
        throw ErrorMessage("Cannot create a new ServiceWorkerRegistration on JS side")
    }
    
    /// Annoying to have to do this, but we need to make sure we have one proxy for each instance. So,
    /// we use this dictionary to track which ones we have and have not already created.
    fileprivate var instanceProxies = [ServiceWorkerInstance: ServiceWorkerProxy]()
    
    
    static let jsClassName = "ServiceWorkerRegistration"
    
    let scope:URL
    let container: ServiceWorkerContainer
    
    init(scope: URL, container: ServiceWorkerContainer) {
        self.scope = scope
        self.container = container
        self.workerManager = container.webview.container.workerManager
        
        super.init()
        
        // We manually grab all the workers that currently exist and put them in appropriate slots
        // whenever a new registration is created
        self.workerManager.activeInstances.forEach { self.workerStateChange($0, newState: $0.installState) }
        
        self.managerListener = workerManager.lifecycleEvents.on("statechange", { ev in
            
            if let stateChangeEvent = ev as? WorkerStateChangeEvent {
                self.workerStateChange(stateChangeEvent.worker, newState: stateChangeEvent.newState)
            } else {
                log.error("Non state change event fired on statechange label")
            }
            
        })
    }
    
    func clearFromExistingStates(worker:ServiceWorkerInstance) {
        
        if self.installing == worker {
            self.installing = nil
        }
        
        if self.waiting == worker {
            self.waiting = nil
        }
        
        if self.active == worker {
            self.active = nil
        }
        
        if self.redundant == worker {
            self.redundant = nil
        }
    }
    
    func workerStateChange( _ worker: ServiceWorkerInstance, newState: ServiceWorkerInstallState) {
        
        if worker.scope.absoluteString != self.scope.absoluteString {
            // If the worker isn't in this scope then we don't care
            return
        }
        
        self.clearFromExistingStates(worker: worker)
        
        if newState == ServiceWorkerInstallState.installing {
            self.installing = worker
        } else if newState == ServiceWorkerInstallState.installed {
            self.waiting = worker
        } else if newState == ServiceWorkerInstallState.redundant {
            self.redundant = worker
        } else if newState == ServiceWorkerInstallState.activated {
            
            self.active = worker
            
            // if this is activated we also want to update the active registration property on our ServiceWorkerContainer
//            self.container.activeRegistration = self
            
            
        }
        
    }
    
    fileprivate func getProxyForWorker(_ worker:ServiceWorkerInstance?) -> ServiceWorkerProxy? {
        
        var proxy:ServiceWorkerProxy? = nil
        
        if let workerExists = worker {
            
            proxy = self.instanceProxies[workerExists]
            
            if proxy == nil {
                proxy = ServiceWorkerProxy(workerExists, messageHandler: self.container.manager)
                self.instanceProxies[workerExists] = proxy
            }
        }
        
        return proxy

    }
    
    func notifyJSOfStateChange(_ worker: ServiceWorkerInstance?, forProperty: String) {
        
        // We need to wrap the instance in our proxy, so that we can easily bridge properties
        // and events between the two.
        
        var proxy:ServiceWorkerProxy? = self.getProxyForWorker(worker)
        
        let data:[String: Any?] = [
            "worker": proxy,
            "property": forProperty
        ]
        
        let cmd = ItemEventCommand(target: self, eventName: "statechange", data: data)
        
        self.container.manager.sendCommand(cmd)

    }
    
    
    /// Destroy all workers associated with this registration
    func unregister() -> Promise<Void> {
        
        let redundantPromises = self.instanceProxies.map { (key, proxy) in
            self.workerManager.makeWorkerRedundant(worker: proxy.instance)
        }
        
        return when(fulfilled: redundantPromises)
        .then { () -> Void in
            self.instanceProxies.removeAll()
            self.container.associatedRegistrations.removeValue(forKey: self.scope.absoluteString)
        }
    }
    
    fileprivate var _active: ServiceWorkerInstance?
    fileprivate var _waiting: ServiceWorkerInstance?
    fileprivate var _installing: ServiceWorkerInstance?
    fileprivate var _redundant: ServiceWorkerInstance?
    
    static func createFromJSArguments(args: [Any?]) throws -> HybridMessageReceiver {
        
        throw ErrorMessage("not yet")
    }
    
    var active:ServiceWorkerInstance? {
        
        get {
            return self._active
        }
        
        set(value) {
            self._active = value
            self.notifyJSOfStateChange(value, forProperty: "active")
        }
        
    }
    
    var installing:ServiceWorkerInstance? {
        
        get {
            return self._installing
        }
        
        set(value) {
            self._installing = value
            self.notifyJSOfStateChange(value, forProperty: "installing")
        }
        
    }
    
    var waiting:ServiceWorkerInstance? {
        
        get {
            return self._waiting
        }
        
        set(value) {
            self._waiting = value
            self.notifyJSOfStateChange(value, forProperty: "waiting")
        }
        
    }
    
    var redundant:ServiceWorkerInstance? {
        
        get {
            return self._redundant
        }
        
        set(value) {
            self._redundant = value
            self.notifyJSOfStateChange(value, forProperty: "redundant")
        }
        
    }
    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>? {
        
        if msg.command == "unregister" {
            return self.unregister()
            .then {
                return nil
            }
        }
        
        return nil
    }
    
    
}
