//
//  ServiceWorkerAPI.swift
//  hybrid
//
//  Created by alastair.coote on 11/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import PromiseKit


/// Emulates the navigator.serviceWorker object in a webview. Extensive bridging in the webview JS library.
class ServiceWorkerAPI: ScriptMessageManager {
    
    
    /// Event listener that receives every service worker change event and runs self.serviceWorkerChange()
    fileprivate var swChangeListener:Listener<ServiceWorkerMatch>?
    
    
    /// The current, active service worker for this webview
    var currentActiveServiceWorker:ServiceWorkerInstance?
    
    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "serviceWorker")
        self.swChangeListener = ServiceWorkerManager.events.on(ServiceWorkerManager.STATUS_CHANGE_EVENT, self.serviceWorkerChange)
        
        self.webview.messageChannelManager!.onMessage = self.sendPostMessageToWorker
    }
    
    
    /// Receives postMessage()s sent from within the webview, and forwards onto the current worker
    ///
    /// - Parameters:
    ///   - message: The message, usually a JSON-encoded string
    ///   - ports: Ports to pass onwards to the worker to be used to send replies back
    func sendPostMessageToWorker(_ message:Any, ports:[MessagePort]) {
        
        let ev = ExtendableMessageEvent(data: message, ports: ports)
        self.currentActiveServiceWorker!.dispatchExtendableEvent(ev)
        
//        do {
//            
//            let parsed = try JSONSerialization.jsonObject(with: message.data(using: String.Encoding.utf8)!, options: [])
//            
//            let ev = ExtendableMessageEvent(data: parsed, ports: ports)
//            self.currentActiveServiceWorker?.dispatchExtendableEvent(ev)
//        } catch {
//            log.error("Could not parse JSON for incoming postMessage. " + String(error))
//        }


    }
    
    func receivePostMessageFromWorker(_ message:Any) {
        // TODO: ports, ports, ports
        
        var jsonString = ""
        
        do {
            
            // if it worked like JSON.stringify it would stringify a string. But it doesn't, so it won't.
            
            if let messageIsString = message as? String {
                jsonString = "\"" + messageIsString + "\""
            } else {
                let json = try JSONSerialization.data(withJSONObject: message, options: JSONSerialization.WritingOptions())
                jsonString = String(data: json, encoding: String.Encoding.utf8)!
            }
            
            
        } catch {
            log.error("Could not serialize incoming message: " + String(describing: error))
        }
        log.debug("Sending message into webview from worker... " + jsonString)
        self.sendEvent("postMessage", arguments: [jsonString, "0"])
        
    }
    
    
    /// Listener for all service worker changes that occur in the app. Noisier than it ought to be, as the first thing
    /// this function does is filter out any events not applicable to the current worker or scope. Candidate for refactoring.
    ///
    /// - Parameter match: The ServiceWorkerMatch that has changed - contains relevant worker metadata
    func serviceWorkerChange(_ match:ServiceWorkerMatch) {
        
        if self.webview.isActive == false || self.webview.mappedURL == nil {
            // often because it's a test webview that has a URL of about:blank
            return
        }
        if self.webview.mappedURL!.absoluteString.hasPrefix(match.scope.absoluteString) == false {
            // Is not in this scope, so ignore it
            return
        }
        
        let matchJSON = JSONSerializable.serialize(match.toSerializableObject())
        
        self.sendEvent("sw-change", arguments: [matchJSON!])
    }
    
    
    /// Receive a new service worker to replace any active worker attached to the webview
    ///
    /// - Parameter newWorker: The new service worker to set as active
    func setNewActiveServiceWorker(_ newWorker:ServiceWorkerInstance) {
        self.currentActiveServiceWorker = newWorker
        
        let match = ServiceWorkerMatch(instanceId: newWorker.instanceId, url: newWorker.url, installState: newWorker.installState, scope: newWorker.scope)
        
        // If we've got a new worker, any currently open ports should be removed.
        self.webview.messageChannelManager!.activePorts.removeAll()
        self.webview.messageChannelManager!.portListeners.removeAll()
        
        let matchJSON = JSONSerializable.serialize(match.toSerializableObject())
        
        self.sendEvent("claimed", arguments: [matchJSON!])
    }
    
    
    /// Equivalent of navigator.serviceWorker.register()
    ///
    /// - Parameters:
    ///   - swPath: Path to the JS file containing the service worker
    ///   - scope: The scope to register the worker under
    /// - Returns: A JSON string for a ServiceWorkerMatch. Is converted to a ServiceWorkerRegistration on the JS side.
    func register(_ swPath:URL, scope:String?) -> Promise<String> {
        
        var actualSWPath = swPath
        
        if WebServerDomainManager.isLocalServerURL(actualSWPath) {
            
            // Register calls can come from both outside and inside local server scenarios.
            // So we need to account for both.
            
            actualSWPath = WebServerDomainManager.mapServerURLToRequestURL(actualSWPath)
        }
        
        var serviceWorkerScope:URL = actualSWPath.deletingLastPathComponent()
        if scope != nil {
            serviceWorkerScope = URL(string: scope!, relativeTo: actualSWPath)!
        }
        
        // forceCheck shouldn't actually be true here - it only forces update if the URL has changed.
        // BUT, it also forces a check on navigation events. For now, we're using this as a shortcut,
        // as all our worker pages will have a register() call on them.
        //
        // TODO: fix this
        
        return ServiceWorkerManager.update(actualSWPath, scope: serviceWorkerScope, forceCheck: true)
        .then { response in
            
            return ServiceWorkerInstance.getById(response)
            .then { sw in
                
                let match = ServiceWorkerMatch(instanceId: response, url: sw!.url, installState: sw!.installState, scope: sw!.scope)
                
                let matchJSON = JSONSerializable.serialize(match.toSerializableObject())
                
                return Promise(value: matchJSON!)
            }
        }
    }
    
    /// Equivalent of ServiceWorkerRegistration.update()
    ///
    /// - Parameter swURL: URL of the service worker to update
    /// - Returns: A string containing "null" - the update function receives no updates on update progress
    func update(_ swURL:URL) -> Promise<String> {
        return ServiceWorkerManager.update(swURL, scope: nil, forceCheck: true)
        .then { newId in
            // Promise doesn't return any info, but catches update errors
            return ServiceWorkerInstance.getById(newId)
            .then { sw in
                
                let match = ServiceWorkerMatch(instanceId: newId, url: sw!.url, installState: sw!.installState, scope: sw!.scope)
                self.serviceWorkerChange(match)
                return Promise(value: "null")
            }
            
        }
    }
    
    
    /// Get all service workers that match this scope. If any are active, attach them to this webview immediately.
    ///
    /// - Parameter webviewURL: The URL of the webview
    /// - Returns: A JSON-encoded array of ServiceWorkerMatch objects
    func getAllWorkers(_ webviewURL:URL) -> Promise<String> {
        return ServiceWorkerManager.getAllServiceWorkersWithScopeContainingURL(webviewURL)
        .then { matches -> String in
            
            let activeWorkers = matches.filter({ match in
                return match.installState == ServiceWorkerInstallState.activated
            })
            
            if activeWorkers.count > 0 {
                // if we have an active worker, load it and save it
                
                ServiceWorkerInstance.getById(activeWorkers[0].instanceId)
                .then { sw in
                    self.currentActiveServiceWorker = sw
                }
                
            }
            
            let jsonObjs = matches.map { match in
                return match.toSerializableObject()
            }
            
            
            return JSONSerializable.serialize(jsonObjs)!
        }
    }
    
    
    /// Handler for incoming messages on the messageHandler
    ///
    /// - Parameter message: Object with required key "operation", which must be register, update or getAll
    /// - Returns: Depends on operation called
    override func handleMessage(_ message: [String: Any]) -> Promise<String>? {
        
        let operation = message["operation"] as! String
        
        var webviewURL = self.webview.url!
        
        if WebServerDomainManager.isLocalServerURL(webviewURL) {
            webviewURL = WebServerDomainManager.mapServerURLToRequestURL(webviewURL)
        }
        // check nil on webviewURL.host as it could be about:blank, which is fine for, say, console operations
//        if webviewURL.host != nil && webviewURL.host! == "localhost" && webviewURL.port! == WebServer.current!.port {
//            webviewURL = WebServer.mapServerURLToRequestURL(webviewURL)
//        }
        
        if operation == "register" {
            let swPath = message["swPath"] as! String
            let scope = message["scope"] as? String
            
            return self.register(URL(string:swPath)!, scope: scope)
        }
        
        if operation == "update" {
            let swURL = message["url"] as! String
            return self.update(URL(string:swURL)!)
        }
        
        if operation == "getAll" {
            return self.getAllWorkers(webviewURL)
        }
        
        
        log.error("Operation not supported: " + operation)
        return nil
    }
}
