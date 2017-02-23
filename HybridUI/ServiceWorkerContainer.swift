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
    var workerUpdateListener: Listener<ServiceWorkerEvent>?
    var getClientsListener: Listener<ServiceWorkerEvent>?
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
        
        self.workerUpdateListener = self.webview.container.workerManager.lifecycleEvents.on("statechange", self.listenForWorkerChange)
        self.getClientsListener = self.webview.container.workerManager.lifecycleEvents.on("getclients", self.checkIfWorkerClient)
        
        self.navigateListener = self.webview.events.on("navigate", self.updateURL)
        self.updateURL()
        
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
    
    var controller: ServiceWorkerInstance? {
        get {
            return self._activeRegistration?.active
        }
    }
    
    func postMessage(_ message: Any, transfer: [Any]) {
        
    }
    
    func claim(by worker: ServiceWorkerInstance) {
        
    }
    
    func checkIfWorkerClient(baseEv: ServiceWorkerEvent) {
        
        if let ev = baseEv as? GetWorkerClientsEvent {
            
        } else {
            log.error("Sent non getClient event on getclients")
        }
        
    }
    
    
    /// If a new worker becomes active within this scope, we want to update our current controller
    func listenForWorkerChange(baseEv: ServiceWorkerEvent) {
        
        if let ev = baseEv as? WorkerStateChangeEvent {
            
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

        } else {
            log.error("Non-state change event sent on statechange")
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
        
        return self.webview.container.workerManager.getAllWorkers(forScope: directory, includingChildScopes: true)
        .then { workers in
            
            let uniqueScopes = Set(workers.map { $0.scope.absoluteString })
            
            let registrations = uniqueScopes.map { scope -> ServiceWorkerRegistration in
                
                var registration = self.associatedRegistrations[scope]
                
                if registration == nil {
                    registration = ServiceWorkerRegistration(scope: URL(string: scope)!, container: self)
                    self.associatedRegistrations[scope] = registration
                }
                
                return registration!
            }
            
            return Promise(value: registrations)
            
            
            
        }
    }
    
    /// While a ServiceWorkerContainer is usually associated with only one registration, it is possible for it
    /// to return more than one via getRegistrations() when there are workers in sub-scopes. We use this dictionary
    /// to make sure we aren't creating the same registrations over and over (we'll leak memory if we do that,
    /// because each one is sent through the serializer and stored in the connected items array)
    var associatedRegistrations = [String: ServiceWorkerRegistration]()

    
    func getOrCreateRegistrationForScope(scope:URL) -> ServiceWorkerRegistration {
        
        var registrationForThisScope = self.associatedRegistrations[scope.absoluteString]
        
        if registrationForThisScope == nil {
            registrationForThisScope = ServiceWorkerRegistration(scope: scope, container: self)
            self.associatedRegistrations[scope.absoluteString] = registrationForThisScope
        }
        
        return registrationForThisScope!
        
    }
    
    
    
    var _currentRegistration: ServiceWorkerRegistration?
    
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
