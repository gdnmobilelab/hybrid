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
import ObjectMapper
import JSCoreBom


class JSContextError : ErrorType {
    let message:String
    let stack:String?
    
    init(message:String){
        self.message = message
        self.stack = nil
        
    }
    
    init(jsValue:JSValue) {
        if jsValue.isObject == true {
            let dict = jsValue.toObject() as! [String: String]
            if let message = dict["message"] {
                self.message = message
                self.stack = dict["stack"]
            } else {
                var msg = ""
                for (key, val) in dict {
                    msg = msg + key + " : " + val
                }
                self.message = msg
                self.stack = nil
            }
        } else {
            self.message = jsValue.toString()
            self.stack = nil
        }
       
        
        
    }

}



struct PromiseReturn {
    let fulfill:(JSValue) -> Void
    let reject:(ErrorType) -> Void
}

class ServiceWorkerOutOfScopeError : ErrorType {
    
}

public class ServiceWorkerInstance {
    
    var jsContext:JSContext!
    var cache:ServiceWorkerCacheHandler!
    var jsBom:JSCoreBom!
    var contextErrorValue:JSValue?
    let url:NSURL!
    let scope:NSURL!
    let timeoutManager = ServiceWorkerTimeoutManager()
    let registration: ServiceWorkerRegistration!
    let webSQL: WebSQLDatabaseCreator!
    var clientManager:WebviewClientManager?
    var installState:ServiceWorkerInstallState!
    let instanceId:Int
    var attachedHybridWebviews = Set<HybridWebview>()
    
    var pendingPromises = Dictionary<Int, PromiseReturn>()
    
    init(url:NSURL, scope: NSURL?, instanceId:Int, installState: ServiceWorkerInstallState) {
        self.url = url
        if (scope != nil) {
            self.scope = scope
        } else {
            self.scope = url.URLByDeletingLastPathComponent
        }
        
        self.installState = installState
        self.instanceId = instanceId
        self.jsContext = JSContext()
        self.jsBom = JSCoreBom()
        self.registration = ServiceWorkerRegistration(url: url, scope: self.scope)
        
        let urlComponents = NSURLComponents(URL: url, resolvingAgainstBaseURL: false)!
        urlComponents.path = nil
        
        self.webSQL = WebSQLDatabaseCreator(context: self.jsContext, origin: urlComponents.URLString)
        self.jsContext.exceptionHandler = self.exceptionHandler
        self.cache = ServiceWorkerCacheHandler(jsContext: self.jsContext, serviceWorkerURL: url)
        
        self.jsBom.extend(self.jsContext, logHandler: self.swLog)
        
        // JSBom adds XMLHTTPRequest and console logging. It also
        // adds setTimeout, but without also adding clearTimeout
        // so we override it in the TimeoutManager
        
        self.jsContext.setObject(JSValue(undefinedInContext: self.jsContext), forKeyedSubscript: "setTimeout")
        
        GlobalFetch.addToJSContext(self.jsContext)
        
        self.clientManager = WebviewClientManager(serviceWorker: self)
        
        
        self.hookFunctions()
        
        if ServiceWorkerManager.currentlyActiveServiceWorkers[instanceId] != nil {
            NSLog("THIS SHOULD NOT OCCUR")
        }
        
        ServiceWorkerManager.currentlyActiveServiceWorkers[instanceId] = self
    }
    
    private func swLog(level:String!, params:[AnyObject]!, formattedLogEntry:String!) {
        if level == "info" || level == "log" {
            log.info(formattedLogEntry)
        }
        else if level == "warn" {
            log.warning(formattedLogEntry)
        }
        else if level == "error" {
            log.error(formattedLogEntry)
        }
    }
    
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
    
    func receiveMessage(message:String, ports: [MessagePort]) {
        self.jsContext.objectForKeyedSubscript("hybrid")
            .objectForKeyedSubscript("dispatchMessageEvent")
            .callWithArguments([message, ports])
    }
    
    func scopeContainsURL(url:NSURL) -> Bool {
        return url.absoluteString!.hasPrefix(self.scope.absoluteString!)
    }
    
    
    private func hookFunctions() {
        
        let promiseCallbackAsConvention: @convention(block) (JSValue, JSValue, JSValue) -> Void = self.nativePromiseCallback
        self.jsContext.setObject(unsafeBitCast(promiseCallbackAsConvention, AnyObject.self), forKeyedSubscript: "__promiseCallback")

        self.timeoutManager.hookFunctions(self.jsContext)
        
        self.jsContext.setObject(MessagePort.self, forKeyedSubscript: "MessagePort")
        self.jsContext.setObject(self.clientManager, forKeyedSubscript: "__WebviewClientManager")
        self.jsContext.setObject(self.registration, forKeyedSubscript: "__serviceWorkerRegistration")
        self.jsContext.setObject(PushManager.self, forKeyedSubscript: "PushManager")
    }
    
    private func consoleLog(args: JSValue) {
        Console.logLevel(args.toString(), webviewURL: NSURL(string: self.url.absoluteString!)!)
    }
    
    private func jsPromiseCallback(pendingIndex: Int, fulfillValue:AnyObject?, rejectValue: AnyObject?) {
        let funcToRun = self.jsContext
            .objectForKeyedSubscript("hybrid")
            .objectForKeyedSubscript("promiseCallback")
        if rejectValue != nil {
            funcToRun.callWithArguments([pendingIndex, NSNull(), rejectValue!])
        } else {
            
            // TODO: investigate this. callWithArguments doesn't seem to like ? variables,
            // but I'm not sure why.
            
            var fulfillValueToReturn:AnyObject = NSNull()
            if fulfillValue != nil {
                fulfillValueToReturn = fulfillValue!
            }
            
            funcToRun.callWithArguments([pendingIndex, fulfillValueToReturn, NSNull()])
        }
        
    }
    
    private func nativePromiseCallback(pendingIndex: JSValue, error: JSValue, response: JSValue) {
        let pendingIndexAsInt = Int(pendingIndex.toInt32())
        if (error.isNull == false) {
            pendingPromises[pendingIndexAsInt]?.reject(JSContextError(jsValue: error))
        } else {
            pendingPromises[pendingIndexAsInt]?.fulfill(response)
        }
        pendingPromises.removeValueForKey(pendingIndexAsInt)
    }
    
    private func getVacantPromiseIndex() -> Int {
        // We can't use an array because we need the indexes to stay consistent even
        // when an entry has been removed. So instead we check every index until we
        // find an empty one, then use that.
        
        var pendingIndex = 0
        while pendingPromises[pendingIndex] != nil {
            pendingIndex += 1
        }
        return pendingIndex
    }
    
    func executeJSPromise(js:String) -> Promise<JSValue> {
        
        // We can't use an array because we need the indexes to stay consistent even
        // when an entry has been removed. So instead we check every index until we
        // find an empty one, then use that.
        
        let pendingIndex = self.getVacantPromiseIndex()
       
        return Promise<JSValue> { fulfill, reject in
            pendingPromises[pendingIndex] = PromiseReturn(fulfill: fulfill, reject: reject)
            self.runScript("hybrid.promiseBridgeBackToNative(" + String(pendingIndex) + "," + js + ");",closeDatabasesAfter: false)
            .error { err in
                reject(err)
            }
        } .always {
            // We don't want to auto-close DB connections after runScript because the promise
            // will continue to execute after that. So instead, we tidy up our webSQL connections
            // once the promise has fulfilled (or errored out)
            //self.webSQL.closeAll()
        }
    }
    
    func executeJS(js:String) -> JSValue {
        return self.jsContext.evaluateScript(js)
    }
    
    func dispatchExtendableEvent(name: String, data: Mappable?) -> Promise<JSValue> {
        return self.executeJSPromise("hybrid.dispatchExtendableEvent('" + name + "')")

    }
    
    func dispatchFetchEvent(fetch: FetchRequest) -> Promise<FetchResponse?> {
        
        let dispatch = self.jsContext.objectForKeyedSubscript("hybrid")
            .objectForKeyedSubscript("dispatchFetchEvent")
            .callWithArguments([fetch])
        
        return PromiseBridge<FetchResponse>(jsPromise: dispatch)
    }
    
    func loadServiceWorker(workerJS:String) -> Promise<JSValue> {
        return self.loadContextScript()
        .then {_ in 
            self.runScript(workerJS)
        }
    }
    
    private func loadContextScript() -> Promise<JSValue> {
        
        return Promise<String> {fulfill, reject in
            let workerContextPath = NSBundle.mainBundle().pathForResource("worker-context", ofType: "js", inDirectory: "js-dist")!
            let contextJS = try NSString(contentsOfFile: workerContextPath, encoding: NSUTF8StringEncoding) as String
            fulfill(contextJS)
        }.then { js in
            return self.runScript("var self = {}; var global = self; hybrid = {}; var window = global; var navigator = {}; navigator.userAgent = 'Hybrid service worker';" + js)
        }.then { js in
            
            return self.applyGlobalVariables()
        }
    }
    
    func applyGlobalVariables() -> Promise<JSValue> {
        // JSContext doesn't have a 'global' variable so instead we make our own,
        // then go through and manually declare global variables.
        
        let keys = self.jsContext.evaluateScript("Object.keys(global);").toArray() as! [String]
        var globalsScript = ""
        for key in keys {
            globalsScript += "var " + key + " = global['" + key + "']; false;";
        }
        log.info("Global variables: " + keys.joinWithSeparator(", "))
        
        return self.runScript(globalsScript)

    }

    
    func runScript(js: String, closeDatabasesAfter: Bool = true) -> Promise<JSValue> {
        self.contextErrorValue = nil
        return Promise<JSValue> { fulfill, reject in
            let result = self.jsContext.evaluateScript(js)
            if (self.contextErrorValue != nil) {
                let errorText = self.contextErrorValue!.toString()
                reject(JSContextError(message:errorText))
            } else {
                fulfill(result)
            }
        }.always {
            if (closeDatabasesAfter == true) {
                // There is no standard hook on closing WebSQL connections, so we handle
                // it manually. We assume we'll close unless told otherwise (as we do with
                // promises)
               // self.webSQL.closeAll()
            }
        }
    }
    
    
    func exceptionHandler(context:JSContext!, exception:JSValue!) {
        self.contextErrorValue = exception
        log.error("JSCONTEXT error: " + exception.toString())
        
    }
    
    func getURLInsideServiceWorkerScope(url: NSURL) throws -> NSURL {
        
        //let startRange = self.scope.absoluteString.ra
        let range = url.absoluteString!.rangeOfString(self.scope.absoluteString!)
        
        if range == nil || range!.startIndex != self.scope.absoluteString!.startIndex {
            throw ServiceWorkerOutOfScopeError()
        }
        
        let escapedServiceWorkerURL = self.url.absoluteString!.stringByAddingPercentEncodingWithAllowedCharacters(NSCharacterSet.alphanumericCharacterSet())!
        
        let escapedTargetURL = url.absoluteString!.stringByAddingPercentEncodingWithAllowedCharacters(NSCharacterSet.alphanumericCharacterSet())!
        
        
        let returnComponents = NSURLComponents(string: "http://localhost")!
        returnComponents.port = WebServer.current!.port
        
        let pathComponents:[String] = [
            "__service_worker",
            escapedServiceWorkerURL,
            url.host!,
            url.path!.substringFromIndex(url.path!.startIndex.advancedBy(1))
        ]
        
        
        returnComponents.path = "/" + pathComponents.joinWithSeparator("/")
        NSLog(pathComponents.joinWithSeparator("/"))
        return returnComponents.URL!

        
        //stringByAddingPercentEncodingWithAllowedCharacters
    }
}
