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
@objc protocol ServiceWorkerInstanceExports : JSExport {
    var scriptURL:String {get}
}


/// The core of our service worker functionality. This class wraps a JSContext with a series of helper functions
/// that add our SW helper library, as well as provide hooks for things like setTimeout and event execution
@objc open class ServiceWorkerInstance : NSObject, ServiceWorkerInstanceExports {
    
    
    /// The actual JavascriptCore context in which our worker lives and runs.
    var jsContext:JSContext!
    
    /// Errors encountered in the JSContext are passed to exceptionHandler() rather than
    /// immediately returning. So, we store the error in this variable and pluck it back
    /// out so that we can keep it in our Promise chain.
    fileprivate var contextErrorValue:JSValue?
    
    
    /// The remote URL this service worker was downloaded from.
    let url:URL!
    
    
    /// The scope for this service worker
    let scope:URL!
    
    var registration: ServiceWorkerRegistration?
    
    
    /// While service workers don't support WebSQL, we're using a WebSQL-based shim to add
    /// IndexedDB support.
    let webSQL: WebSQLDatabaseCreator!
    var clientManager:WebviewClientManager?
    
    
    var installState:ServiceWorkerInstallState!
    
    
    /// The ID for this worker. This is controlled by the database, where it is set by an
    /// auto-incrementing primary key.
    let instanceId:Int
    
    
    /// The same as the url property, but returns a string instead of NSURL, so that we can use
    /// this in the JSContext. Matches the Service Worker spec's scriptURL property.
    var scriptURL:String {
        get {
            return self.url.absoluteString
        }
    }
    
    var console:Console
    
    /// Another shim to match the service worker spec, this turns out installstate enum into
    /// a string.
    var state:String {
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
    
    var globalScope:ServiceWorkerGlobalScope
    
    
    init(url:URL, scope: URL?, instanceId:Int, installState: ServiceWorkerInstallState) {
        
        self.url = url
        if (scope != nil) {
            self.scope = scope
        } else {
            self.scope = url.deletingLastPathComponent()
        }
        
        self.installState = installState
        self.instanceId = instanceId
        
        var urlComponents = URLComponents(url: url, resolvingAgainstBaseURL: false)!
        urlComponents.path = ""
        self.jsContext = JSContext()
        self.globalScope = ServiceWorkerGlobalScope(context: self.jsContext, workerURL: url, scope: self.scope)
        self.webSQL = WebSQLDatabaseCreator(context: self.jsContext, origin: urlComponents.url!.absoluteString)
        
        self.console = Console(context: self.jsContext)
        
        super.init()
        
        
        self.jsContext.exceptionHandler = self.exceptionHandler
        self.jsContext.name = "SW — " + url.absoluteString
        
        self.registration = ServiceWorkerRegistration(worker: self)
        self.clientManager = WebviewClientManager(serviceWorker: self)
        
        self.hookFunctions()
        
//        ServiceWorkerManager.currentlyActiveServiceWorkers[instanceId] = self
    }
    
    
    /// Fetch a service worker by its URL (not scope). Will return an already running worker if it exists, if not
    /// if it will create a new one.
    ///
    /// - Parameter url: The URL this service worker was downloaded from
    /// - Returns: A promise that returns a ServiceWorkerInstance if it exists locally, if not, nil
//    static func getActiveWorkerByURL(_ url:URL) -> Promise<ServiceWorkerInstance?> {
//        
//        log.info("Request for service worker at URL: " + url.absoluteString)
//        
//        for (_, worker) in ServiceWorkerManager.currentlyActiveServiceWorkers {
//            if worker.url == url {
//                return Promise<ServiceWorkerInstance?>(value: worker)
//            }
//        }
//        
//        var instance:ServiceWorkerInstance? = nil
//        var contents:String? = nil
//        
//        return Promise(value: ())
//            .then {
//                try Db.mainDatabase.inDatabase({ (db) in
//                    
//                    let serviceWorkerContents = try db.executeQuery("SELECT instance_id, scope, contents FROM service_workers WHERE url = ? AND install_state = ?", values: [url.absoluteString, ServiceWorkerInstallState.activated.rawValue])
//                    
//                    if serviceWorkerContents.next() == false {
//                        return serviceWorkerContents.close()
//                    }
//                    
//                    let scope = URL(string: serviceWorkerContents.string(forColumn: "scope"))!
//                    let instanceId = Int(serviceWorkerContents.int(forColumn: "instance_id"))
//                    
//                    instance = ServiceWorkerInstance(
//                        url: url,
//                        scope: scope,
//                        instanceId: instanceId,
//                        installState: ServiceWorkerInstallState.activated
//                    )
//                    
//                    log.debug("Created new instance of service worker with ID " + String(instanceId) + " and install state: " + String(describing: instance!.installState))
//                    contents = serviceWorkerContents.string(forColumn: "contents")
//                    serviceWorkerContents.close()
//                })
//                
//                if instance == nil {
//                    return Promise<ServiceWorkerInstance?>(value: nil)
//                }
//                
//                return instance!.loadServiceWorker(contents!)
//                    .then { _ in
//                        return instance
//                }
//                
//        }
//        
//    }
    
    
    /// Fetch a service worker directly by ID. In many cases (particularly cross-process) we already know
    /// exactly which worker we want to target. Will return an already running worker if it exists, if not
    /// if it will create a new one.
    ///
    /// - Parameter id: The service worker ID, as created by the database primary key
    /// - Returns: A promise returning either a ServiceWorkerInstance if it exists, or nil if not
//    static func getById(_ id:Int) -> Promise<ServiceWorkerInstance?> {
//        
//        log.debug("Request for service worker with ID " + String(id))
//        return Promise(value: ())
//            .then { () -> Promise<ServiceWorkerInstance?> in
//                
//                let existingWorker = ServiceWorkerManager.currentlyActiveServiceWorkers[id]
//                
//                if existingWorker != nil {
//                    log.debug("Returning existing service worker for ID " + String(id))
//                    return Promise(value: existingWorker)
//                }
//                
//                
//                var instance:ServiceWorkerInstance? = nil
//                var contents:String? = nil
//                
//                try Db.mainDatabase.inDatabase({ (db) in
//                    
//                    let serviceWorkerContents = try db.executeQuery("SELECT url, scope, contents, install_state FROM service_workers WHERE instance_id = ?", values: [id])
//                    
//                    if serviceWorkerContents.next() == false {
//                        return serviceWorkerContents.close()
//                    }
//                    
//                    let url = URL(string: serviceWorkerContents.string(forColumn: "url"))!
//                    let scope = URL(string: serviceWorkerContents.string(forColumn: "scope"))!
//                    let installState = ServiceWorkerInstallState(rawValue: Int(serviceWorkerContents.int(forColumn: "install_state")))!
//                    
//                    instance = ServiceWorkerInstance(
//                        url: url,
//                        scope: scope,
//                        instanceId: id,
//                        installState: installState
//                    )
//                    
//                    log.debug("Created new instance of service worker with ID " + String(id) + " and install state: " + String(describing: instance!.installState))
//                    contents = serviceWorkerContents.string(forColumn: "contents")
//                    serviceWorkerContents.close()
//                })
//                
//                if instance == nil {
//                    return Promise<ServiceWorkerInstance?>(value: nil)
//                }
//                
//                return instance!.loadServiceWorker(contents!)
//                    .then { _ in
//                        return instance
//                }
//                
//        }
//        
//    }
    
    
    /// Very simple check to see if any given URL lives within the scope of this worker
    ///
    /// - Parameter url: The URL to check
    /// - Returns: true if within scope, otherwise false
    func scopeContainsURL(_ url:URL) -> Bool {
        return url.absoluteString.hasPrefix(self.scope.absoluteString)
    }
    
    
    /// Add various classes and objects to the global scope of the service worker. To be broken out
    /// into a ServiceWorkerGlobalScope class at some point, possibly.
    fileprivate func hookFunctions() {
        
        let selfObj = self.jsContext.objectForKeyedSubscript("self")
        
        let toBind: [String:AnyObject] = [
            "registration": self.registration!,
            "clients": self.clientManager!,
            ]
        
        for (key, val) in toBind {
            selfObj?.setObject(val, forKeyedSubscript: key as (NSCopying & NSObjectProtocol)!)
            self.jsContext.setObject(val, forKeyedSubscript: key as (NSCopying & NSObjectProtocol)!)
        }
        
    }
    
    
    /// Service workers have "extendable events" - normal JS events that come with an e.waitUntil()
    /// function attached. These allow you to extend the life of a service worker until the promises
    /// inside waitUntil() have completed.
    ///
    /// - Parameter ev: The ExtendableEvent to dispatch. We have a few subclasses like NotificationEvent.
    /// - Returns: A promise that waits until any waitUntil() call has completed. Right now it returns a value from that, it should not.
    func dispatchExtendableEvent(_ ev:ExtendableEvent) -> Promise<Void> {
        
        let funcToRun = self.jsContext.objectForKeyedSubscript("self")
            .objectForKeyedSubscript("dispatchEvent")!
        
        funcToRun.call(withArguments: [ev])
        
        return ev.resolve()
        
        //        return PromiseBridge<JSValue>(jsPromise: funcToRun.callWithArguments([ev]))
        //        .then { returnValue -> JSValue? in
        //            if self.contextErrorValue != nil {
        //                throw JSContextError(jsValue: returnValue!)
        //            }
        //            return returnValue
        //        }
        
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
    func loadServiceWorker(_ workerJS:String) -> Promise<Void> {
        return self.loadContextScript()
            .then {_ in
                return self.runScript(workerJS)
            }
            .then { _ in
                return self.processPendingPushEvents()
        }
    }
    
    
    /// Unfortunately, we can't necessarily process push events as they arrive because the app may not be active.
    /// This function will process any push events created in a notification content context, or other.
    ///
    /// - Returns: An empty promise that will fulfill when all push events have been processed.
    func processPendingPushEvents() -> Promise<Void> {
        
        let pendingPushes = PendingPushEventStore.getByWorkerURL(self.url.absoluteString)
        
        let processPromises = pendingPushes.map { push -> Promise<Void> in
            
            let pushEvent = PushEvent(dataAsString: push.payload)
            
            // Since we're acting in response to a push event we don't want to duplicate any
            // notification that's already been shown. So we store notification data for later
            // use in the notification content view.
            //
            // This is only used in background mode as we can suppress the remote notification
            // in foreground mode.
            
            self.registration!.storeNotificationShowWithID = push.pushID
            
            // We remove the event BEFORE sending it because the event might well call update,
            // which would mean the new worker would try to process this event as well.
            PendingPushEventStore.remove(push)
            
            return self.dispatchExtendableEvent(pushEvent)
                .then {_ in
                    
                    
                    
                    if self.registration!.storeNotificationShowWithID != nil {
                        
                        // This will happen if we receive a push event that doesn't try to show
                        // a notification. That isn't allowed because iOS has already shown a notification
                        // no matter what. In the future we can use iOS silent notifications, though.
                        
                        log.error("ServiceWorkerRegistration did not store notification show data - your push event didn't use showNotification()?")
                        
                        self.registration!.storeNotificationShowWithID = nil
                    }
                    
                    return Promise(value: ())
            }
            
        }
        
        return when(fulfilled: processPromises)
            .recover { err -> Void in
                log.error("Error encountered when processing push events: " + String(describing: err))
        }
        
    }
    
    
    /// Loads the shell JavaScript, containing our various shims and utility functions to replicate the global
    /// service worker environment.
    ///
    /// - Returns: An empty promise that fulfills immediately (the operation is synchonous). Promise is used to catch errors.
    fileprivate func loadContextScript() -> Promise<Void> {
        
        return Promise<String> {fulfill, reject in
            
            let workerContextPath = SharedResources.appBundle.path(forResource: "worker-context", ofType: "js", inDirectory: "js-dist")!;
            
            let contextJS = try String(contentsOfFile: workerContextPath, encoding: String.Encoding.utf8)
            fulfill(contextJS)
            }.then { js in
                return self.runScript("var global = self; hybrid = {}; var navigator = {}; navigator.userAgent = 'hybrid service worker';" + js)
            }.then { js in
                self.applyGlobalVariables()
                return Promise(value: ())
        }
    }
    
    
    /// JSContext doesn't have a 'global' variable so instead we make our own,
    /// then go through and manually declare global variables.
    fileprivate func applyGlobalVariables() {
        
        let global = self.jsContext.objectForKeyedSubscript("global")!
        
        
        let globalKeys = self.jsContext
            .objectForKeyedSubscript("Object")
            .objectForKeyedSubscript("keys")
            .call(withArguments: [global])
            .toArray() as! [String]
        
        for key in globalKeys {
            self.jsContext.setObject(global.objectForKeyedSubscript(key)!, forKeyedSubscript: key as (NSCopying & NSObjectProtocol)!)
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
            if (self.contextErrorValue != nil) {
                let errorText = self.contextErrorValue!.toString()
                reject(JSContextError(message:errorText!))
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
    
}
