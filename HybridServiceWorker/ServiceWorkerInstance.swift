//
//  ServiceWorkerInstance.swift
//  hybrid
//
//  Created by alastair.coote on 08/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit
import FMDB
import UserNotifications
import HybridShared

/// The variables and methods we expose to be used inside the JSContext. The instance itself
/// is available within the context as self.registration.active
@objc protocol ServiceWorkerInstanceExports : JSEventEmitterExports {
    var scriptURL:String {get}
    var state: String {get}
    var onstatechange: JSValue? {get set}
}


/// The core of our service worker functionality. This class wraps a JSContext with a series of helper functions
/// that add our SW helper library, as well as provide hooks for things like setTimeout and event execution
@objc public class ServiceWorkerInstance : JSEventEmitter, ServiceWorkerInstanceExports {
    
    static let containingVirtualMachine = JSVirtualMachine()!
    
    /// The actual JavascriptCore context in which our worker lives and runs.
    let jsContext:JSContext
    
    /// Errors encountered in the JSContext are passed to exceptionHandler() rather than
    /// immediately returning. So, we store the error in this variable and pluck it back
    /// out so that we can keep it in our Promise chain.
    fileprivate var contextErrorValue:JSValue?
    
    /// Sometimes we want to send events that'll only fire outside of the worker
    public let exteriorEvents = JSEventEmitter()
    
    
    /// The remote URL this service worker was downloaded from.
    public let url:URL
    
    /// The scope for this service worker
    public let scope:URL
    
    fileprivate var _globalScope:ServiceWorkerGlobalScope?
    
    public var globalScope: ServiceWorkerGlobalScope {
        get {
            return self._globalScope!
        }
    }
    
    public var skipWaitingStatus: Bool {
        get {
            return self.globalScope.skipWaitingStatus
        }
    }
    
    
    /// JS can set a function directly to onstatechange rather than use addEventListener.
    /// So we need to manually map it to an event listener when they do.
    
    var _onstatechange: JSValue? = nil
    
    var onstatechange:JSValue? {
        
        get {
            return self._onstatechange
        }
        
        set (value) {
            
            // if we have an existing value, remove the event listener for it
            if let stateChangeFunc = self._onstatechange {
                self.removeEventListener("statechange", withJSFunc: stateChangeFunc)
            }
            
            if value == nil || value!.isNull == true || value!.isUndefined == true {
                return
            }
            
            self._onstatechange = value
            self.addEventListener(StateChangeEvent.self, withJSFunc: value!)
            
        }
    }
    
    /// The same as the url property, but returns a string instead of NSURL, so that we can use
    /// this in the JSContext. Matches the Service Worker spec's scriptURL property.
    var scriptURL:String {
        get {
            return self.url.absoluteString
        }
    }
    
    /// Another shim to match the service worker spec, this turns out installstate enum into
    /// a string.
    public var state:String {
        get {
            if self.installState == ServiceWorkerInstallState.activated {
                return "activated"
            }
            if self.installState == ServiceWorkerInstallState.activating {
                return "activating"
            }
            if self.installState == ServiceWorkerInstallState.installed {
                return "installed"
            }
            if self.installState == ServiceWorkerInstallState.installing {
                return "installing"
            }
            if self.installState == ServiceWorkerInstallState.redundant {
                return "redundant"
            }
            return ""
        }
    }

    public init(url:URL, scope: URL?, installState: ServiceWorkerInstallState, registration: ServiceWorkerRegistrationProtocol? = nil) {
        
        self.url = url
        
        if let scopeExists = scope {
            self.scope = scopeExists
        } else {
            self.scope = url.deletingLastPathComponent()
        }
        
        self._installState = installState
        
        self.jsContext = JSContext(virtualMachine: ServiceWorkerInstance.containingVirtualMachine)
        
        super.init()
        
        self._globalScope = ServiceWorkerGlobalScope(worker: self, registration: registration)
        
        
        self.jsContext.exceptionHandler = self.exceptionHandler
        self.jsContext.name = "SW — " + url.absoluteString
        
//        ServiceWorkerManager.currentlyActiveServiceWorkers[instanceId] = self
    }
    
    
    /// Not sure if this actually works, but this flags to the garbage collector that this JSContext is ready
    /// to be removed. At least according to this:
    ///
    /// http://stackoverflow.com/questions/35689482/force-garbage-collection-of-javascriptcore-virtual-machine-on-ios
    public func destroy() {
        self.jsContext.name = "SW (destroyed) - " + self.url.absoluteString
        JSGarbageCollect(self.jsContext.jsGlobalContextRef)
    }
    
    
    /// Similar to dispatchExtendableEvent, except that FetchEvents do actually have response you can parse
    /// - they use e.respondWith() instead of e.waitUntil()
    ///
    /// - Parameter fetch: A FetchRequest to process.
    /// - Returns: The FetchResponse returned by processing the fetch event
    func dispatchFetchEvent(_ fetch: FetchRequest) -> Promise<FetchResponse?> {
        
        let dispatch = self.jsContext.objectForKeyedSubscript("hybrid")
            .objectForKeyedSubscript("dispatchFetchEvent")
            .call(withArguments: [fetch])!
        
        return JSPromiseToPromise<FetchResponse>.pass(dispatch)
    }
    
    
    
    /// Process and load the service worker JS. Will also load the service worker shell that is embedded in the main app bundle.
    /// Once loaded, it will fire any pending push events that occurred while the app was not open (e.g. in a notification)
    ///
    /// - Parameter workerJS: The JS to run
    /// - Returns: A promise when execution is complete and any pending push events have fired.
    public func loadServiceWorker(_ workerJS:String) -> Promise<Void> {
        return self.loadContextScript()
        .then {_ in
            return self.runScript(workerJS)
        }.then { js in
            return Promise(value: ())
        }
//            .then { _ in
//                return self.processPendingPushEvents()
//        }
    }
    
    
    /// Unfortunately, we can't necessarily process push events as they arrive because the app may not be active.
    /// This function will process any push events created in a notification content context, or other.
    ///
    /// - Returns: An empty promise that will fulfill when all push events have been processed.
//    func processPendingPushEvents() -> Promise<Void> {
//        
//        let pendingPushes = PendingPushEventStore.getByWorkerURL(self.url.absoluteString)
//        
//        let processPromises = pendingPushes.map { push -> Promise<Void> in
//            
//            let pushEvent = PushEvent(dataAsString: push.payload)
//            
//            // Since we're acting in response to a push event we don't want to duplicate any
//            // notification that's already been shown. So we store notification data for later
//            // use in the notification content view.
//            //
//            // This is only used in background mode as we can suppress the remote notification
//            // in foreground mode.
//            
//            self.globalScope.registration.storeNotificationShowWithID = push.pushID
//            
//            // We remove the event BEFORE sending it because the event might well call update,
//            // which would mean the new worker would try to process this event as well.
//            PendingPushEventStore.remove(push)
//            
//            return self.dispatchExtendableEvent(pushEvent)
//                .then {_ in
//                    
//                    
//                    
//                    if self.globalScope.registration.storeNotificationShowWithID != nil {
//                        
//                        // This will happen if we receive a push event that doesn't try to show
//                        // a notification. That isn't allowed because iOS has already shown a notification
//                        // no matter what. In the future we can use iOS silent notifications, though.
//                        
//                        log.error("ServiceWorkerRegistration did not store notification show data - your push event didn't use showNotification()?")
//                        
//                        self.globalScope.registration.storeNotificationShowWithID = nil
//                    }
//                    
//                    return Promise(value: ())
//            }
//            
//        }
//        
//        return when(fulfilled: processPromises)
//            .recover { err -> Void in
//                log.error("Error encountered when processing push events: " + String(describing: err))
//        }
//        
//    }
    
    var userAgent:String {
        get {
            return "com.gdnmobilelab.hybrid/" + (SharedResources.appBundle.infoDictionary!["CFBundleShortVersionString"] as! String)
        }
    }
    
    
    /// Loads the shell JavaScript, containing our various shims and utility functions to replicate the global
    /// service worker environment.
    ///
    /// - Returns: An empty promise that fulfills immediately (the operation is synchonous). Promise is used to catch errors.
    fileprivate func loadContextScript() -> Promise<Void> {
        
        return Promise<String> { fulfill, reject in
            
            let workerBundle = Bundle(for: ServiceWorkerInstance.self)
            
            let workerContextPath = workerBundle.path(forResource: "worker-context", ofType: "js", inDirectory: "js-dist")!;
            
            let contextJS = try String(contentsOfFile: workerContextPath, encoding: String.Encoding.utf8)
            fulfill(contextJS)
            
        }
        .then { js in
            return self.runScript("var global = self; var hybrid = {}; var navigator = {}; navigator.userAgent = '" + self.userAgent + "';" + js)
        }.then { js in
            return Promise(value: ())
        }
    }
    
    
    /// JSContext logs exceptions via the exceptionHandler() function, so this is a quick wrapper
    /// to run JS, catch any potential error, or return if the script was successful.
    ///
    /// - Parameter js: the JavaScript to execute
    /// - Returns: Empty promise upon execution completion
    fileprivate func runScript(_ js: String) -> Promise<JSValue> {
        self.contextErrorValue = nil
        return Promise<JSValue> { fulfill, reject in
            
            let result = self.jsContext.evaluateScript(js)
            if let error = self.contextErrorValue {
                
                let message = error.objectForKeyedSubscript("message").toString()
                
                reject(ErrorMessage(message!))
            } else {
                fulfill(result!)
            }
        }
    }
    
    
    /// Used to catch JS exceptions, to be returned as part of runScript(). Not run directly, run by
    /// the JSContext itself.
    ///
    /// - Parameters:
    ///   - context: the worker's JSContext
    ///   - exception: The error as a JSValue
    fileprivate func exceptionHandler(_ context:JSContext?, exception:JSValue?) {
        if let exceptionExists = exception {
            self.contextErrorValue = exceptionExists
            log.error("JSCONTEXT error: " + exceptionExists.toString())
        } else {
            log.error("Exception called with no exception?")
        }
    }
    
    fileprivate var _installState:ServiceWorkerInstallState
    
    public var installState: ServiceWorkerInstallState {
        get {
            return self._installState
        }
        set(value) {
            self._installState = value
            self.jsContext.name = "SW (\(self.state)) — " + url.absoluteString
            self.dispatchEvent(StateChangeEvent(workerInstance: self))
        }
    }
    
}
