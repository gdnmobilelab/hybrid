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



/// A quick struct to store promise fulfill/reject functions in. Serves the same
/// purpose as a tuple, just simpler to read in code.
struct PromiseReturn {
    let fulfill:(JSValue) -> Void
    let reject:(ErrorType) -> Void
}


/// The variables and methods we expose to be used inside the JSContext. The instance itself
/// is available within the context as self.registration.active
@objc protocol ServiceWorkerInstanceExports : JSExport {
    var scriptURL:String {get}
}


/// The core of our service worker functionality. This class wraps a JSContext with a series of helper functions
/// that add our SW helper library, as well as provide hooks for things like setTimeout and event execution
@objc public class ServiceWorkerInstance : NSObject, ServiceWorkerInstanceExports {
    
    
    /// The actual JavascriptCore context in which our worker lives and runs.
    var jsContext:JSContext!
    
    var cache:ServiceWorkerCacheHandler!
    
    
    /// Errors encountered in the JSContext are passed to exceptionHandler() rather than
    /// immediately returning. So, we store the error in this variable and pluck it back
    /// out so that we can keep it in our Promise chain.
    private var contextErrorValue:JSValue?
    
    
    /// The remote URL this service worker was downloaded from.
    let url:NSURL!
    
    
    /// The scope for this service worker
    let scope:NSURL!
    
    let timeoutManager = ServiceWorkerTimeoutManager()
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
            return self.url.absoluteString!
        }
    }
    
    
    /// Another shim to match the service worker spec, this turns out installstate enum into
    /// a string.
    var state:String {
        get {
            if self.installState == ServiceWorkerInstallState.Activated {
                return "activated"
            }
            if self.installState == ServiceWorkerInstallState.Activating {
                return "activating"
            }
            if self.installState == ServiceWorkerInstallState.Installed {
                return "installed"
            }
            if self.installState == ServiceWorkerInstallState.Installing {
                return "installing"
            }
            if self.installState == ServiceWorkerInstallState.Redundant {
                return "redundant"
            }
            return ""
         }
    }
    
    
    init(url:NSURL, scope: NSURL?, instanceId:Int, installState: ServiceWorkerInstallState) {
        
        self.url = url
        if (scope != nil) {
            self.scope = scope
        } else {
            self.scope = url.URLByDeletingLastPathComponent
        }
        
        self.installState = installState
        self.instanceId = instanceId
        
        let urlComponents = NSURLComponents(URL: url, resolvingAgainstBaseURL: false)!
        urlComponents.path = nil
        self.jsContext = JSContext()
        self.webSQL = WebSQLDatabaseCreator(context: self.jsContext, origin: urlComponents.URL!.absoluteString!)
        
        super.init()
        
    
        self.jsContext.exceptionHandler = self.exceptionHandler
        self.jsContext.name = "SW — " + url.absoluteString!
        self.cache = ServiceWorkerCacheHandler(serviceWorker: self)
        GlobalFetch.addToJSContext(self.jsContext)
        
        self.registration = ServiceWorkerRegistration(worker: self)
        self.clientManager = WebviewClientManager(serviceWorker: self)
        
        self.hookFunctions()
        
        if ServiceWorkerManager.currentlyActiveServiceWorkers[instanceId] != nil {
            NSLog("THIS SHOULD NOT OCCUR")
        }
        
        ServiceWorkerManager.currentlyActiveServiceWorkers[instanceId] = self
    }
    
    
    /// Fetch a service worker by its URL (not scope). Will return an already running worker if it exists, if not
    /// if it will create a new one.
    ///
    /// - Parameter url: The URL this service worker was downloaded from
    /// - Returns: A promise that returns a ServiceWorkerInstance if it exists locally, if not, nil
    static func getActiveWorkerByURL(url:NSURL) -> Promise<ServiceWorkerInstance?> {
        
        log.info("Request for service worker at URL: " + url.absoluteString!)
        
        for (_, worker) in ServiceWorkerManager.currentlyActiveServiceWorkers {
            if worker.url == url {
                return Promise<ServiceWorkerInstance?>(worker)
            }
        }
        
        var instance:ServiceWorkerInstance? = nil
        var contents:String? = nil
        
        return Promise<Void>()
        .then {
            try Db.mainDatabase.inDatabase({ (db) in
                
                let serviceWorkerContents = try db.executeQuery("SELECT instance_id, scope, contents FROM service_workers WHERE url = ? AND install_state = ?", values: [url.absoluteString!, ServiceWorkerInstallState.Activated.rawValue])
                
                if serviceWorkerContents.next() == false {
                    return serviceWorkerContents.close()
                }
                
                let scope = NSURL(string: serviceWorkerContents.stringForColumn("scope"))!
                let instanceId = Int(serviceWorkerContents.intForColumn("instance_id"))
                
                instance = ServiceWorkerInstance(
                    url: url,
                    scope: scope,
                    instanceId: instanceId,
                    installState: ServiceWorkerInstallState.Activated
                )
                
                log.debug("Created new instance of service worker with ID " + String(instanceId) + " and install state: " + String(instance!.installState))
                contents = serviceWorkerContents.stringForColumn("contents")
                serviceWorkerContents.close()
            })
            
            if instance == nil {
                return Promise<ServiceWorkerInstance?>(nil)
            }
            
            return instance!.loadServiceWorker(contents!)
                .then { _ in
                    return instance
            }

        }

    }
    
   
    /// Fetch a service worker directly by ID. In many cases (particularly cross-process) we already know
    /// exactly which worker we want to target. Will return an already running worker if it exists, if not
    /// if it will create a new one.
    ///
    /// - Parameter id: The service worker ID, as created by the database primary key
    /// - Returns: A promise returning either a ServiceWorkerInstance if it exists, or nil if not
    static func getById(id:Int) -> Promise<ServiceWorkerInstance?> {
        
        log.debug("Request for service worker with ID " + String(id))
        return Promise<Void>()
        .then { () -> Promise<ServiceWorkerInstance?> in
            
            let existingWorker = ServiceWorkerManager.currentlyActiveServiceWorkers[id]
            
            if existingWorker != nil {
                log.debug("Returning existing service worker for ID " + String(id))
                return Promise<ServiceWorkerInstance?>(existingWorker)
            }
            
            
            var instance:ServiceWorkerInstance? = nil
            var contents:String? = nil
            
            try Db.mainDatabase.inDatabase({ (db) in
                
                let serviceWorkerContents = try db.executeQuery("SELECT url, scope, contents, install_state FROM service_workers WHERE instance_id = ?", values: [id])
                
                if serviceWorkerContents.next() == false {
                    return serviceWorkerContents.close()
                }
                
                let url = NSURL(string: serviceWorkerContents.stringForColumn("url"))!
                let scope = NSURL(string: serviceWorkerContents.stringForColumn("scope"))!
                let installState = ServiceWorkerInstallState(rawValue: Int(serviceWorkerContents.intForColumn("install_state")))!
                
                instance = ServiceWorkerInstance(
                    url: url,
                    scope: scope,
                    instanceId: id,
                    installState: installState
                )
                
                log.debug("Created new instance of service worker with ID " + String(id) + " and install state: " + String(instance!.installState))
                contents = serviceWorkerContents.stringForColumn("contents")
                serviceWorkerContents.close()
            })
            
            if instance == nil {
                return Promise<ServiceWorkerInstance?>(nil)
            }
            
            return instance!.loadServiceWorker(contents!)
            .then { _ in
                return instance
            }
            
        }
        
    }
    
    
    /// Very simple check to see if any given URL lives within the scope of this worker
    ///
    /// - Parameter url: The URL to check
    /// - Returns: true if within scope, otherwise false
    func scopeContainsURL(url:NSURL) -> Bool {
        return url.absoluteString!.hasPrefix(self.scope.absoluteString!)
    }
    
    
    /// Add various classes and objects to the global scope of the service worker. To be broken out
    /// into a ServiceWorkerGlobalScope class at some point, possibly.
    private func hookFunctions() {
        
        self.timeoutManager.hookFunctions(self.jsContext)
        
        self.jsContext.setObject(MessagePort.self, forKeyedSubscript: "MessagePort")
        
        self.jsContext.setObject(self.registration, forKeyedSubscript: "__serviceWorkerRegistration")
        self.jsContext.setObject(PushManager.self, forKeyedSubscript: "PushManager")
        self.jsContext.setObject(Console.self, forKeyedSubscript: "NativeConsole")
        self.jsContext.setObject(self.clientManager, forKeyedSubscript: "clients")
        self.jsContext.setObject(MessageChannel.self, forKeyedSubscript: "MessageChannel")
        self.jsContext.setObject(WindowClient.self, forKeyedSubscript: "Client")
        self.jsContext.setObject(ExtendableMessageEvent.self, forKeyedSubscript: "ExtendableMessageEvent")
        self.jsContext.setObject(MessagePort.self, forKeyedSubscript: "MessagePort")
        self.jsContext.setObject(OffscreenCanvas.self, forKeyedSubscript: "OffscreenCanvas")
        self.jsContext.setObject(OffscreenCanvasRenderingContext2D.self, forKeyedSubscript: "CanvasRenderingContext2D")
        self.jsContext.setObject(ImageBitmap.self, forKeyedSubscript: "ImageBitmap")
        self.jsContext.setObject(ExtendableEvent.self, forKeyedSubscript: "ExtendableEvent")
        self.jsContext.setObject(Notification.self, forKeyedSubscript: "Notification")
    }
    
    
    /// Execute a JavaScript string. Usage stronly discouraged, to be deprecated ASAP (currently only
    /// used to check the skipWaiting() status of a worker), use event dispatching etc. instead.
    ///
    /// - Parameter js: String of the JS to execute
    /// - Returns: Any JSValue that comes out of that execution
    func executeJS(js:String) -> JSValue {
        return self.jsContext.evaluateScript(js)
    }
    
    
    /// Service workers have "extendable events" - normal JS events that come with an e.waitUntil()
    /// function attached. These allow you to extend the life of a service worker until the promises
    /// inside waitUntil() have completed.
    ///
    /// - Parameter ev: The ExtendableEvent to dispatch. We have a few subclasses like NotificationEvent.
    /// - Returns: A promise that waits until any waitUntil() call has completed. Right now it returns a value from that, it should not.
    func dispatchExtendableEvent(ev:ExtendableEvent) -> Promise<JSValue?> {
        
        let funcToRun = self.jsContext.objectForKeyedSubscript("hybrid")
            .objectForKeyedSubscript("dispatchExtendableEvent")
        
        return PromiseBridge<JSValue>(jsPromise: funcToRun.callWithArguments([ev]))

    }
    
    
    /// Similar to dispatchExtendableEvent, except that FetchEvents do actually have response you can parse
    /// - they use e.respondWith() instead of e.waitUntil()
    ///
    /// - Parameter fetch: A FetchRequest to process.
    /// - Returns: The FetchResponse returned by processing the fetch event
    func dispatchFetchEvent(fetch: FetchRequest) -> Promise<FetchResponse?> {
        
        let dispatch = self.jsContext.objectForKeyedSubscript("hybrid")
            .objectForKeyedSubscript("dispatchFetchEvent")
            .callWithArguments([fetch])
        
        return PromiseBridge<FetchResponse>(jsPromise: dispatch)
    }
    
    
    
    /// Process and load the service worker JS. Will also load the service worker shell that is embedded in the main app bundle.
    /// Once loaded, it will fire any pending push events that occurred while the app was not open (e.g. in a notification)
    ///
    /// - Parameter workerJS: The JS to run
    /// - Returns: A promise when execution is complete and any pending push events have fired.
    func loadServiceWorker(workerJS:String) -> Promise<Void> {
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
        
        let pendingPushes = PushEventStore.getByWorkerScope(self.scope.absoluteString!)
        
        let processPromises = pendingPushes.map { push -> Promise<Void> in
            
            let pushEvent = PushEvent(data: push.payload)
            
            return self.dispatchExtendableEvent(pushEvent)
            .then {_ in
                PushEventStore.remove(push)
                return Promise<Void>()
            }
            
        }
        
        return when(processPromises)

    }
    
    
    /// Loads the shell JavaScript, containing our various shims and utility functions to replicate the global
    /// service worker environment.
    ///
    /// - Returns: An empty promise that fulfills immediately (the operation is synchonous). Promise is used to catch errors.
    private func loadContextScript() -> Promise<Void> {
        
        return Promise<String> {fulfill, reject in
            
            let workerContextPath = Util.appBundle().pathForResource("worker-context", ofType: "js", inDirectory: "js-dist")!;
           
            let contextJS = try NSString(contentsOfFile: workerContextPath, encoding: NSUTF8StringEncoding) as String
            fulfill(contextJS)
        }.then { js in
            return self.runScript("var self = {}; var global = self; hybrid = {}; var window = global; var navigator = {}; navigator.userAgent = 'Hybrid service worker';" + js)
        }.then { js in
            self.applyGlobalVariables()
            return Promise<Void>()
        }
    }
    
    
    /// JSContext doesn't have a 'global' variable so instead we make our own,
    /// then go through and manually declare global variables.
    private func applyGlobalVariables() {
        
        let global = self.jsContext.objectForKeyedSubscript("global")
        
        let globalKeys = self.jsContext
            .objectForKeyedSubscript("Object")
            .objectForKeyedSubscript("keys")
            .callWithArguments([global])
            .toArray() as! [String]
        
        for key in globalKeys {
            self.jsContext.setObject(global.objectForKeyedSubscript(key), forKeyedSubscript: key)
        }

    }

    
    /// JSContext logs exceptions via the exceptionHandler() function, so this is a quick wrapper
    /// to run JS, catch any potential error, or return if the script was successful.
    ///
    /// - Parameter js: the JavaScript to execute
    /// - Returns: Empty promise upon execution completion
    private func runScript(js: String) -> Promise<JSValue> {
        self.contextErrorValue = nil
        return Promise<JSValue> { fulfill, reject in
            let result = self.jsContext.evaluateScript(js)
            if (self.contextErrorValue != nil) {
                let errorText = self.contextErrorValue!.toString()
                reject(JSContextError(message:errorText))
            } else {
                fulfill(result)
            }
        }
    }
    
    
    /// Used to catch JS exceptions, to be returned as part of runScript(). Not run directly, run by
    /// the JSContext itself.
    ///
    /// - Parameters:
    ///   - context: the worker's JSContext
    ///   - exception: The error as a JSValue
    private func exceptionHandler(context:JSContext!, exception:JSValue!) {
        self.contextErrorValue = exception
        
        log.error("JSCONTEXT error: " + exception.toString())
        
    }
    
}
