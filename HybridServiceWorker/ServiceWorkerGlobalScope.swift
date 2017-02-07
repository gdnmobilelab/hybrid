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
    
    init(context:JSContext, workerURL:URL, scope: URL) {
        
        self.jsContext = context
        self.scope = scope
        self.cache = ServiceWorkerCacheStorage(scope: self.scope, workerURL: workerURL)
        self.timeout = TimeoutManager()
        
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
    
    
    /// Go through all of our global scope objects, apply to "self" *and* to the
    /// global scope of the worker. Using Object.keys() feels like of hacky, but it works.
    func applySelfToGlobal() {
        
        self.jsContext.setObject(ServiceWorkerGlobalScope.self, forKeyedSubscript: "ServiceWorkerGlobalScope" as (NSCopying & NSObjectProtocol)!)
        self.jsContext.setObject(self, forKeyedSubscript: "self" as (NSCopying & NSObjectProtocol)!)
        
        // Slightly confusing, but we now grab the JSValue version of this class, so that we can apply
        // custom keys to it.
        
        let jsSelf = self.jsContext.objectForKeyedSubscript("self")
        
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
            "clearInterval": self.timeout.clearInterval
        ]
        
        for (key, val) in toApply {
            
            // Declare as a global variable
            self.jsContext.setObject(val, forKeyedSubscript: key as (NSCopying & NSObjectProtocol)!)
            // And also add to the self object
            jsSelf?.setObject(val, forKeyedSubscript: key as (NSCopying & NSObjectProtocol)!)
            
        }
        
    }
    
}
