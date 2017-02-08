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
    let jsContext:JSContext
    let scope:URL
    let cache:ServiceWorkerCacheStorage
    let timeout: TimeoutManager
    let console: Console
    let clientManager: WebviewClientManager
    let registration: ServiceWorkerRegistration
    let webSQL: WebSQLDatabaseCreator
    
    init(context:JSContext, workerURL:URL, scope: URL) {
        
        self.jsContext = context
        self.scope = scope
        self.cache = ServiceWorkerCacheStorage(scope: self.scope, workerURL: workerURL)
        self.timeout = TimeoutManager()
        self.console = Console(context: context)
        self.clientManager = WebviewClientManager(scope: self.scope, workerURL: workerURL)
        self.registration = ServiceWorkerRegistration(scope: self.scope, workerURL: workerURL)
        
        var domainComponents = URLComponents(url: scope, resolvingAgainstBaseURL: true)!
        domainComponents.path = "/"
        
        self.webSQL = WebSQLDatabaseCreator(context: context, origin: domainComponents.url!.absoluteString)
        
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
        self.jsContext.setObject(val, forKeyedSubscript: prop as (NSCopying & NSObjectProtocol)!)
        obj.setObject(val, forKeyedSubscript: prop as (NSCopying & NSObjectProtocol)!)
        return true
    }
    
    
    /// Go through all of our global scope objects, apply to "self"
    func applySelfToGlobal() {
        
        self.jsContext.setObject(ServiceWorkerGlobalScope.self, forKeyedSubscript: "ServiceWorkerGlobalScope" as (NSCopying & NSObjectProtocol)!)

        // Define this global scope as a JSValue
        let selfObj = JSValue(object: self, in: self.jsContext)!
        
        // Now create a proxy to surround this global scope
        let jsSelf = attachProxyToSelf(selfObj: selfObj)
        
        // Now set the 'self' variable as actually being the proxy, not the original object
        self.jsContext.setObject(jsSelf, forKeyedSubscript: "self" as (NSCopying & NSObjectProtocol)!)
        
        let toApply:[String:AnyObject] = [
            "caches": self.cache,
            "Cache": ServiceWorkerCache.self,
            "MessagePort": MessagePort.self,
            "ServiceWorkerRegistration": ServiceWorkerRegistration.self,
            "PushManager": PushManager.self,
            "MessageChannel": MessageChannel.self,
            "Client": WindowClient.self,
            "ExtendableMessageEvent": ExtendableMessageEvent.self,
            "OffscreenCanvas": OffscreenCanvas.self,
            "OffscreenCanvasRenderingContext2D": OffscreenCanvasRenderingContext2D.self,
            "ImageBitmap": ImageBitmap.self,
            "ExtendableEvent": ExtendableEvent.self,
            "Notification": Notification.self,
            "PushMessageData": PushMessageData.self,
            "createImageBitmap": ImageBitmap.createImageBitmap,
            "Request": FetchRequest.self,
            "Response": FetchResponse.self,
            "fetch": GlobalFetch.fetchWithScope(scope: self.scope),
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
