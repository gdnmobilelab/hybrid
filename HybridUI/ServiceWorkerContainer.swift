//
//  ServiceWorkerContainer.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker
import HybridWorkerManager
import PromiseKit
import WKWebviewBridge
import HybridShared

@objc class ServiceWorkerContainer : NSObject, HybridMessageReceiver, WorkerClientProtocol {
    
    static let jsClassName = "ServiceWorkerContainer"

    let manager: HybridMessageManager
    let webview: HybridWebview
    var navigateListener:Listener<Void>?
    var workerUpdateListener: Listener<PendingWorkerStateChangeEvent>?
    var getClientsListener: Listener<GetWorkerClientsEvent>?
    var containerURL:URL
    
    
    // For WorkerClientProtocol
    
    let frameType:String
    let id = "WHAT_SHOULD_WE_USE_FOR_UNIQUE_ID?"
    
    var url: String { get { return self.containerURL.absoluteString } }
    
    init(manager: HybridMessageManager, containerURL: URL, frameType: String) {
        
        self.manager = manager
        self.webview = manager.webview!
        self.containerURL = containerURL
        self.frameType = frameType
        
        super.init()
        
        self.workerUpdateListener = self.webview.container.workerManager.addEventListener(self.listenForWorkerChange)
        self.getClientsListener = self.webview.container.workerManager.addEventListener(self.checkIfWorkerClient)

        self.checkForController()
        
        self.updateURL()
        
    }
    
    func checkForController() {
        _ = self.webview.container.workerManager.getWorkers(forScope: self.containerURL, options: [.includeParentScopes], withState: [.activated])
        .then { existingWorkers in
            self.controller = existingWorkers.first
        }
    }
    
    fileprivate var _activeRegistration: ServiceWorkerRegistration?
    
    var activeRegistration: ServiceWorkerRegistration? {
        get {
            return self._activeRegistration
        }
        set(value) {
            
            if self._activeRegistration == value {
                // don't trigger the JS event if we haven't actually changed
                return
            }
            
            self._activeRegistration = value
            
            // forward this onto our JS proxy
            let cmd = ItemEventCommand(target: self, eventName: "newactiveregistration", data: value)
            self.manager.sendCommand(cmd)
            
        }
    }
    
    func unload() {
        self.webview.container.workerManager.removeEventListener(self.workerUpdateListener!)
        self.webview.container.workerManager.removeEventListener(self.getClientsListener!)
        
    }
    
    var controller: ServiceWorkerInstance? {
        get {
            return self._controller
        }
        set (value) {
            
            if self._controller == value {
                return
            }
            
            self._controller = value
            
            if let newController = value {
                
                let proxy = self.getOrCreateProxyForWorker(newController)
                
                let cmd = ItemEventCommand(target: self, eventName: "newcontroller", data: proxy)
                self.manager.sendCommand(cmd)
            }

        }
    }
    
    fileprivate var _controller: ServiceWorkerInstance?
    
    func postMessage(_ message: Any, transfer: [Any]) {
        
    }
    
    func claim(by worker: ServiceWorkerInstance) -> Promise<Void> {
        return Promise(value: ())
        .then { () -> Void in
            
            let reg = self.getOrCreateRegistrationForScope(scope: worker.scope)
            
            self.activeRegistration = reg
            self.controller = worker

            
        }
        
    }
    
    func checkIfWorkerClient(ev: GetWorkerClientsEvent) {
        
        if self.containerURL.absoluteString.hasPrefix(ev.scope.absoluteString) == false {
            
            // This container is not in scope for this worker, so we can safely disregard
            
            return
        }
        
        // Even if it is in scope, our current worker scope might be more specific than the
        // new worker. If so, this also isn't an eligible client
        
        if self.activeRegistration != nil && self.activeRegistration!.scope.absoluteString.characters.count > ev.scope.absoluteString.characters.count {
            return
        }
        
        // Otherwise, we're good to add ourselves as an eligible client.
        
        ev.addEligibleClient(client: self)
        
    }
    
    
    /// If a new worker becomes active within this scope, we want to update our current controller
    func listenForWorkerChange(ev: PendingWorkerStateChangeEvent) {
        
        let scopeString = ev.worker.scope.absoluteString
        
        if ev.newState != .activated {
            // we only care about activated workers here, so disregard if not
            return
        }
        
        let containerURLString = self.containerURL.absoluteString
        
        if containerURLString.hasPrefix(scopeString) == false {
            // Worker scope doesn't contain this webview, so we can safely ignore it
            return
        }
        
        if self.activeRegistration != nil && scopeString.characters.count < self.activeRegistration!.scope.absoluteString.characters.count {
            // If our existing scope is more specific than the incoming one, we also ignore it. Using a string length to measure
            // specificity. Feels... wrong to do that, but I can't think of a better way?
            return
        }
        
        // The registration constructor will pick up this worker in its constructor, and setting
        // our activeRegistration variable will trigger the event to dispatch this to the client.
        let newRegistration = self.getOrCreateRegistrationForScope(scope: ev.worker.scope)
        
        // This is hacky. But the registration constructor won't automatically place this worker in the "active"
        // slot, because it's still at activating (with a switch to active pending). Event listeners in registration would
        // move it, but we've created this too late for that to happen. So we do it manually. Again: hrm.
        
        newRegistration.active = ev.worker
        
        self.activeRegistration = newRegistration
        
        // We normally don't set the controller attribute until a worker runs self.clients.claim(), but if there is
        // no existing worker then we do it immediately.
        
        if self.controller == nil {
            self.controller = ev.worker
        }

    }

    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>? {
        
        // Swift compiler complains unless we manually cast our results to Any?, so we
        // do exactly that
        
        return Promise(value: ())
        .then { () -> Promise<Any?> in
            
            if msg.command == "register" {
                return try self.register(withOptions: ServiceWorkerRegisterMessage.fromPayload(payload: msg.data!, webviewURL: msg.messageHandler.webview!.url!))
                .then { $0 as Any? }
            } else if msg.command == "getRegistrations" {
                
                return self.getRegistrations()
                .then { $0 as Any? }
                
            } else if msg.command == "init" {
                return Promise(value: nil)
            }
            
            throw ErrorMessage("Unrecognised command")

        }
        
    }
    
    static func createFromJSArguments(args: [Any?], from manager: HybridMessageManager) -> HybridMessageReceiver {
        
        let containerURL = URL(string: args[0] as! String)!
        let frameType = args[1] as! String
        
        return ServiceWorkerContainer(manager: manager, containerURL: containerURL, frameType: frameType)
    }
    
    internal func getArgumentsForJSMirror() throws -> [Any?] {
        throw ErrorMessage("ServiceWorkerContainer should never be constructed on the native side")
    }
    
    
    /// When the webview URL changes, we want to ensure our container reflects workers for that new URL.
    func updateURL() {
        
//        let currentPageURL = self.webview.url!
        
        
        
    }
    
    func getRegistrations() -> Promise<[ServiceWorkerRegistration]> {
        
        let directory = self.containerURL.deletingLastPathComponent()
        
        return self.webview.container.workerManager.getAllNonRedundantWorkers(forScope: directory, options: [.includeChildScopes, .includeParentScopes])
        .then { workers in
            
            
            
            let uniqueScopes = Set(workers.map { $0.scope.absoluteString })
            
            let registrations = uniqueScopes.map { scope -> ServiceWorkerRegistration in
                
                return self.getOrCreateRegistrationForScope(scope: URL(string: scope)!)
            }
            
            return Promise(value: registrations)
            
            
            
        }
    }
    
    /// While a ServiceWorkerContainer is usually associated with only one registration, it is possible for it
    /// to return more than one via getRegistrations() when there are workers in sub-scopes. We use this dictionary
    /// to make sure we aren't creating the same registrations over and over (we'll leak memory if we do that,
    /// because each one is sent through the serializer and stored in the connected items array)
    var associatedRegistrations = [String: ServiceWorkerRegistration]()
    
    var associatedProxies = [ServiceWorkerInstance: ServiceWorkerProxy]()
    
    
  
    
    func getOrCreateRegistrationForScope(scope:URL) -> ServiceWorkerRegistration {
        
        let scopeAsString = scope.absoluteString
        
        var registrationForThisScope = self.associatedRegistrations[scopeAsString]
        
        if registrationForThisScope == nil {
            registrationForThisScope = ServiceWorkerRegistration(scope: scope, container: self)
            registrationForThisScope!.onunregister = self.unregisterRegistration
            self.associatedRegistrations[scopeAsString] = registrationForThisScope
        }
        
        return registrationForThisScope!
        
    }
    
    func unregisterRegistration(registration: ServiceWorkerRegistration) -> Promise<Void> {
        
        registration.unload()
        
        // Remove this registration from our associated list
        self.associatedRegistrations.removeValue(forKey: registration.scope.absoluteString)
        
        // But we also want to remove any worker proxies associated AND not used by any other
        // registrations
        let workersOnlyUsedByThisRegistration = registration.allWorkersUsed.filter { worker in
            return self.associatedRegistrations.filter { $0.value.allWorkersUsed.contains(worker) == true }.count == 0
        }
        
        let proxiesOnlyUsedByThisRegistration = workersOnlyUsedByThisRegistration.map { self.associatedProxies[$0]! }
        
        // Now we know which workers this applies to, unload the proxies and make the workers redundant
        let redundantPromises = proxiesOnlyUsedByThisRegistration.map { proxy -> Promise<Void> in
            proxy.unload()
            return self.webview.container.workerManager.makeWorkerRedundant(worker: proxy.instance)
        }
        
        return when(fulfilled: redundantPromises)
        
    }
    
    func getOrCreateProxyForWorker(_ worker:ServiceWorkerInstance?) -> ServiceWorkerProxy? {
        
        var proxy:ServiceWorkerProxy? = nil
        
        if let workerExists = worker {
            
            proxy = self.associatedProxies[workerExists]
            
            if proxy == nil {
                proxy = ServiceWorkerProxy(workerExists, messageHandler: self.manager)
                self.associatedProxies[workerExists] = proxy
            }
        }
        
        return proxy
        
    }
    
    func register(withOptions: ServiceWorkerRegisterMessage) -> Promise<ServiceWorkerRegistration> {
        return self.manager.webview!.container.workerManager.register(url: withOptions.scriptURL, scope: withOptions.scope)
        .then {
            return Promise(value: self.getOrCreateRegistrationForScope(scope: withOptions.scope))
        }
    }
    
    func getRegistration(test:String) -> String {
        
        return test
    }
}
