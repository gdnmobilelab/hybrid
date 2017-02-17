//
//  ServiceWorkerContainer.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker
import PromiseKit
import WKWebviewBridge
import HybridShared

@objc class ServiceWorkerContainer : NSObject, HybridMessageReceiver {
    
    static let jsClassName = "ServiceWorkerContainer"

    var controller: String?
    
    let webview: HybridWebview
    var navigateListener:Listener<Void>?
    
    init(webview: HybridWebview) {
        
        self.webview = webview
        
        super.init()
        
        self.navigateListener = self.webview.events.on("navigate", self.updateURL)
    }
    
    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>? {
        
        return Promise(value: ())
        .then { () -> Promise<Any?> in
            
            if msg.command == "register" {
                return try self.register(withOptions: ServiceWorkerRegisterMessage.fromPayload(payload: msg.data!, webviewURL: msg.webview.url!))
                .then {
                    // JS promises don't really support returning void, so we use nil
                    return nil
                }
            } else if msg.command == "getRegistrations" {
                return self.getRegistrations()
                .then { registrations in
                    return registrations as Any
                }
            }
            
            throw ErrorMessage("Unrecognised command")

        }
        
    }
    
    static func createFromJSArguments(args: [Any?], from manager: HybridMessageManager) -> HybridMessageReceiver {
        return ServiceWorkerContainer(webview: manager.webview!)
    }
    
    internal func getArgumentsForJSMirror() throws -> [Any?] {
        throw ErrorMessage("ServiceWorkerContainer should never be constructed on the native side")
    }
    
    
    /// When the webview URL changes, we want to ensure our container reflects workers for that new URL.
    func updateURL() {
        
    }
    
    func getRegistrations() -> Promise<[ServiceWorkerRegistration]> {
        return self.webview.container.workerManager.getAllWorkers(forScope: self.webview.url!, includingChildScopes: true)
        .then { workers in
            
            // ServiceWorkerRegistrations are scope-based, so we need to separate out how many
            // scopes we have in this collection
            var workersByScope = [URL: [ServiceWorkerInstance]]()
            
            workers.forEach { worker in
                
                // Separate our workers out into arrays by scope. If the array doesn't
                // exist yet, create it.
                
                if workersByScope[worker.scope] == nil {
                    workersByScope[worker.scope] = []
                }
                
                workersByScope[worker.scope]!.append(worker)
            }
            
            // Now we grab or create all the registrations needed
            let registrations = try workersByScope.map { (scopeURL, _) -> ServiceWorkerRegistration in
                
                var registration = self.webview.container.registrationManager.getRegistration(forScope: scopeURL)
                
                if registration == nil {
                    registration = ServiceWorkerRegistration(scope: scopeURL)
                    try self.webview.container.registrationManager.addRegistration(registration!)
                }
                
                return registration!
                
            }
            
            
            // Take our fetched workers and assign them accordingly
            registrations.forEach { registration in
                
                workersByScope[registration.scope]!.forEach { worker in
                 
                    if worker.installState == ServiceWorkerInstallState.activated {
                        registration.active = worker
                    } else if worker.installState == ServiceWorkerInstallState.installing {
                        registration.installing = worker
                    } else if worker.installState == ServiceWorkerInstallState.installed {
                        registration.waiting = worker
                    } else if worker.installState == ServiceWorkerInstallState.redundant {
                        registration.redundant = worker
                    }
                    
                }
                
            }
            
            return Promise(value: registrations)
            
            
            
        }
    }
    
    func register(withOptions: ServiceWorkerRegisterMessage) -> Promise<Void> {
        return Promise(value:())
    }
    
    
    @objc(getRegistration:)
    func getRegistration(test:String) -> String {
        
        return test
    }
}
