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
    
//    fileprivate var associatedContainers = Set<ServiceWorkerContainer>()
    fileprivate var managerListener: Listener<PendingWorkerStateChangeEvent>?
    
    let workerManager:ServiceWorkerManager
    
    internal func getArgumentsForJSMirror() throws -> [Any?] {
        return [self.scope.absoluteString]
    }
    
    internal static func createFromJSArguments(args: [Any?], from manager: HybridMessageManager) throws -> HybridMessageReceiver {
        throw ErrorMessage("Cannot create a new ServiceWorkerRegistration on JS side")
    }

    
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
        
        self.managerListener = workerManager.addEventListener { (ev:PendingWorkerStateChangeEvent) -> Void in
            self.workerStateChange(ev.worker, newState: ev.newState)
        }
    }
    
    func unload() {
        self.workerManager.removeEventListener(self.managerListener!)
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
    
    
    
    func notifyJSOfStateChange(_ worker: ServiceWorkerInstance?, forProperty: String) {
        
        // We need to wrap the instance in our proxy, so that we can easily bridge properties
        // and events between the two.
        
        let proxy:ServiceWorkerProxy? = self.container.getOrCreateProxyForWorker(worker)
        
        let data:[String: Any?] = [
            "worker": proxy,
            "property": forProperty
        ]
        
        let cmd = ItemEventCommand(target: self, eventName: "statechange", data: data)
        
        self.container.manager.sendCommand(cmd)

    }
    
    var onunregister: ((ServiceWorkerRegistration) -> Promise<Void>)? = nil
    
    /// Destroy all workers associated with this registration
    func unregister() -> Promise<Void> {
        
        if let onunreg = self.onunregister {
            
            return onunreg(self)
            
        } else {
            
            log.warning("Unregistered registration without a listener attached")
            return Promise(value: ())
        }

    }
    
    
    /// Quick shortcut to grab all the workers used in his registration, to stop us having to go
    /// through each property individually
    var allWorkersUsed: [ServiceWorkerInstance] {
        get {
            
            let allPossibles = [self.active, self.waiting, self.installing, self.redundant]
            
            return allPossibles.filter { $0 != nil }.map { $0! }
            
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
