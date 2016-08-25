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
import ObjectMapper
import EmitterKit

class ServiceWorkerRegisterOptions : Mappable {
    var scope:String?
    
    required init?(_ map: Map) {
        
    }
    
    func mapping(map: Map) {
        scope    <- map["scope"]
    }
}

class ServiceWorkerRegisterRequest : Mappable {
    var path:NSURL!;
    var pathAsString:String!
    var options:ServiceWorkerRegisterOptions?;
    
    required init?(_ map: Map) {
        
    }
    
    func mapping(map: Map) {
        path    <- (map["path"], URLTransform())
        options <- map["options"]
    }
}

class ServiceWorkerRegisterFailedError: ErrorType {}

class ServiceWorkerAPI: ScriptMessageManager {
    
    private var swChangeListener:Listener?
    
    var currentActiveServiceWorker:ServiceWorkerInstance?
    
    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "serviceWorker")
        
        self.swChangeListener = ServiceWorkerManager.events.on(ServiceWorkerManager.STATUS_CHANGE_EVENT, self.serviceWorkerChange)
        
        
        
        self.webview.messageChannelManager!.onMessage = self.handleIncomingPostMessage
    }
    
    func handleIncomingPostMessage(message:String, ports:[MessagePort]) {

        self.currentActiveServiceWorker!.receiveMessage(message, ports: ports)
    }
    
    func serviceWorkerChange(match:ServiceWorkerMatch) {
        
        if self.webview.mappedURL == nil {
            // often because it's a test webview that has a URL of about:blank
            return
        }
        if self.webview.mappedURL!.absoluteString!.hasPrefix(match.scope.absoluteString!) == false {
            // Is not in this scope, so ignore it
            return
        }
        
        self.sendEvent("sw-change", arguments: [match.toJSONString()!])
    }
    
    func setNewActiveServiceWorker(newWorker:ServiceWorkerInstance) {
        self.currentActiveServiceWorker = newWorker
        
        let match = ServiceWorkerMatch(instanceId: newWorker.instanceId, url: newWorker.url, installState: newWorker.installState, scope: newWorker.scope)
        
        self.webview.messageChannelManager!.activePorts.removeAll()
        self.webview.messageChannelManager!.portListeners.removeAll()
        
        self.sendEvent("claimed", arguments: [match.toJSONString()!])
    }
    
    func register(swPath:NSURL, scope:NSURL?, webviewURL:NSURL) -> Promise<String> {
        
        let urlOfServiceWorker = URLUtilities.resolveToBaseURL(swPath, baseURL: webviewURL)
       
        var serviceWorkerScope:NSURL = urlOfServiceWorker.URLByDeletingLastPathComponent!
        if scope != nil {
            serviceWorkerScope = URLUtilities.resolveToBaseURL(scope!, baseURL: webviewURL)
        }
        
        return ServiceWorkerManager.update(urlOfServiceWorker, scope: serviceWorkerScope)
        .then { response in
            
            return ServiceWorkerInstance.getById(response)
            .then { sw in
                
                let match = ServiceWorkerMatch(instanceId: response, url: sw!.url, installState: sw!.installState, scope: sw!.scope)
                return Promise<String>(match.toJSONString()!)
            }
        }
    }
    
    func update(swURL:NSURL) -> Promise<String> {
        return ServiceWorkerManager.update(swURL)
        .then { newId in
            // Promise doesn't return any info, but catches update errors
            return ServiceWorkerInstance.getById(newId)
            .then { sw in
                sw!.attachedHybridWebviews.insert(self.webview)
                let match = ServiceWorkerMatch(instanceId: newId, url: sw!.url, installState: sw!.installState, scope: sw!.scope)
                self.serviceWorkerChange(match)
                return Promise<String>("null")
            }
            
        }
    }
    
    func getAllWorkers(webviewURL:NSURL) -> Promise<String> {
        return ServiceWorkerManager.getAllServiceWorkersForURL(webviewURL)
        .then { matches -> String in
            
            let activeWorkers = matches.filter({ match in
                return match.installState == ServiceWorkerInstallState.Activated
            })
            
            if activeWorkers.count > 0 {
                // if we have an active worker, load it and save it
                
                ServiceWorkerInstance.getById(activeWorkers[0].instanceId)
                .then { sw in
                    self.currentActiveServiceWorker = sw
                }
                
            }
            
            
            return matches.toJSONString()!
        }
    }
    
    override func handleMessage(message:AnyObject) -> Promise<String>? {
        let operation = message["operation"] as! String
        
        var webviewURL = self.webview.URL!
        
        
        // check nil on webviewURL.host as it could be about:blank, which is fine for, say, console operations
        if webviewURL.host != nil && webviewURL.host! == "localhost" && webviewURL.port! == WebServer.current!.port {
            webviewURL = WebServer.mapServerURLToRequestURL(webviewURL)
        }
        
        if operation == "register" {
            let swPath = message["swPath"] as! String
            let scope = message["scope"] as? String
            
            var scopeURL:NSURL? = nil
            
            if scope != nil {
                scopeURL = NSURL(string: scope!)!
            }
            
            return self.register(NSURL(string:swPath)!, scope: scopeURL, webviewURL: webviewURL)
        }
        
        if operation == "update" {
            let swURL = message["url"] as! String
            return self.update(NSURL(string:swURL)!)
        }
        
        if operation == "getAll" {
            return self.getAllWorkers(webviewURL)
        }
        
        
        log.error("Operation not supported: " + operation)
        return nil
    }
}
