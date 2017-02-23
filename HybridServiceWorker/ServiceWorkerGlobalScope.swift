//
//  ServiceWorkerGlobalScope.swift
//  hybrid
//
//  Created by alastair.coote on 20/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import HybridShared

@objc protocol ServiceWorkerGlobalScopeExports: JSExport {
    func skipWaiting()
}

/// A work in progress. In time I want to move all of the custom classes into here.
@objc class ServiceWorkerGlobalScope: NSObject, ServiceWorkerGlobalScopeExports {
    
    var skipWaitingStatus = false
//    let jsContext:JSContext
//    let scope:URL
    let worker:ServiceWorkerInstance
    let cache:ServiceWorkerCacheStorage
    let timeout: TimeoutManager
    let console: Console
    let clientManager: WebviewClientManager
    let registration: ServiceWorkerRegistrationWrapper?
    let webSQL: WebSQLDatabaseCreator
    
    
    init(worker:ServiceWorkerInstance, registration: ServiceWorkerRegistrationProtocol?) {
        self.worker = worker
//        self.jsContext = context
//        self.scope = scope
        self.cache = ServiceWorkerCacheStorage(scope: self.worker.scope, workerURL: self.worker.url)
        self.timeout = TimeoutManager()
        self.console = Console(context: self.worker.jsContext)
        self.clientManager = WebviewClientManager(worker: worker)
        
        if registration != nil {
            
            self.registration = ServiceWorkerRegistrationWrapper(instance: registration!)
            
        } else {
            
            // In a break with the Service Worker API, it is possible to run a worker without a
            // registration, if we want it to be entirely isolated from outside events
            
            self.registration = nil
        }
        
        
        var domainComponents = URLComponents(url: self.worker.scope, resolvingAgainstBaseURL: true)!
        domainComponents.path = "/"
        
        self.webSQL = WebSQLDatabaseCreator(context: self.worker.jsContext, origin: domainComponents.url!.absoluteString)
        
        super.init()
        self.applySelfToGlobal()
    }
    
    func skipWaiting() {
        self.skipWaitingStatus = true
    }
    
    fileprivate var skipWaitingAnyObject:AnyObject {
        get {
            let convention: @convention(block) () -> Void = self.skipWaiting
            return unsafeBitCast(convention, to: AnyObject.self)
        }
    }
    
    
    /// Though it's discouraged, there is nothing to stop a custom worker adding properties to
    /// self. If it does, those should also be made available as global variables. So we use
    /// a proxy to listen for these sets.
    /// Proxy documentation: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
    ///
    /// - Parameter selfObj: The 'self' JSValue
    func attachProxyToSelf(selfObj: JSValue) -> JSValue {
        
        let applyGlobalAsConvention = unsafeBitCast(self.addVariableToGlobal as @convention(block) (JSValue, String, JSValue) -> Bool, to: AnyObject.self)
        
        let proxyCreator = selfObj.context.objectForKeyedSubscript("Proxy")!
        
        let proxyInstance = proxyCreator.construct(withArguments: [selfObj, [
            "set": applyGlobalAsConvention
        ]])!
        
        return proxyInstance
    }
    
    func addVariableToGlobal(obj: JSValue, prop:String, val: JSValue) -> Bool {
        self.worker.jsContext.setObject(val, forKeyedSubscript: prop as (NSCopying & NSObjectProtocol)!)
        obj.setObject(val, forKeyedSubscript: prop as (NSCopying & NSObjectProtocol)!)
        return true
    }
    
    
    /// Go through all of our global scope objects, apply to "self"
    func applySelfToGlobal() {
        
        self.worker.jsContext.setObject(ServiceWorkerGlobalScope.self, forKeyedSubscript: "ServiceWorkerGlobalScope" as (NSCopying & NSObjectProtocol)!)

        // Define this global scope as a JSValue
        let selfObj = JSValue(object: self, in: self.worker.jsContext)!
        
        // Now create a proxy to surround this global scope
        let jsSelf = attachProxyToSelf(selfObj: selfObj)
        
        // Now set the 'self' variable as actually being the proxy, not the original object
        self.worker.jsContext.setObject(jsSelf, forKeyedSubscript: "self" as (NSCopying & NSObjectProtocol)!)
        
        let toApply:[String:AnyObject] = [
            "caches": self.cache,
            "Cache": ServiceWorkerCache.self,
            "MessagePort": MessagePort.self,
//            "ServiceWorkerRegistration": ServiceWorkerRegistration.self,
            "PushManager": PushManager.self,
            "MessageChannel": MessageChannel.self,
            "Client": WindowClient.self,
            "ExtendableMessageEvent": ExtendableMessageEvent.self,
            "OffscreenCanvas": OffscreenCanvas.self,
            "OffscreenCanvasRenderingContext2D": OffscreenCanvasRenderingContext2D.self,
            "ImageBitmap": ImageBitmap.self,
            "ExtendableEvent": ExtendableEvent.self,
            "Notification": HybridNotification.self,
            "PushMessageData": PushMessageData.self,
            "createImageBitmap": ImageBitmap.createImageBitmap,
            "Request": FetchRequest.self,
            "Response": FetchResponse.self,
            "fetch": GlobalFetch.fetchWithScope(scope: self.worker.scope),
            "setTimeout": self.timeout.setTimeout,
            "setInterval": self.timeout.setInterval,
            "clearTimeout": self.timeout.clearTimeout,
            "clearInterval": self.timeout.clearInterval,
            "clients": self.clientManager,
            "__WebSQLDatabaseCreator": self.webSQL
        ]
        
        for (key, val) in toApply {
            
            jsSelf.setObject(val, forKeyedSubscript: key as (NSCopying & NSObjectProtocol)!)
            
        }
        
    }
    
}
