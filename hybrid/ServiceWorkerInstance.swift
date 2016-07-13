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


class JSContextError : ErrorType {
    let message:String
    init(message:String){
        self.message = message
    }}

struct PromiseReturn {
    let fulfill:(JSValue) -> Void
    let reject:(ErrorType) -> Void
}

public class ServiceWorkerInstance {
    
    var jsContext:JSContext!
    var contextErrorValue:JSValue?
    let url:String!
    let timeoutManager = ServiceWorkerTimeoutManager()
    let webSQL: WebSQL!
    
    var pendingPromises = Dictionary<Int, PromiseReturn>()
    
    init(url:String) {
        self.url = url
        self.jsContext = JSContext()
        self.webSQL = WebSQL(url: self.url)
        self.jsContext.exceptionHandler = self.exceptionHandler
        self.hookFunctions()
        
    }
    
    private func hookFunctions() {
        
        let promiseCallbackAsConvention: @convention(block) (JSValue, JSValue, JSValue) -> Void = self.promiseCallback
        self.jsContext.setObject(unsafeBitCast(promiseCallbackAsConvention, AnyObject.self), forKeyedSubscript: "__promiseCallback")
        
//        let webSQLQueryAsConvention: @convention(block) (JSValue, JSValue, JSValue) -> [String] = self.executeSqlQueries
//        self.jsContext.setObject(unsafeBitCast(webSQLQueryAsConvention, AnyObject.self), forKeyedSubscript: "__webSQLQuery")
        
        let consoleAsConvention: @convention(block) (JSValue) -> Void = self.consoleLog
        self.jsContext.setObject(unsafeBitCast(consoleAsConvention, AnyObject.self), forKeyedSubscript: "__console")
        
        self.timeoutManager.hookFunctions(self.jsContext)
        self.webSQL.hookFunctions(self.jsContext)
    }
    
    private func consoleLog(args: JSValue) {
        Console.logLevel(args.toString(), webviewURL: NSURL(string: self.url)!)
    }
    
    
    private func promiseCallback(pendingIndex: JSValue, error: JSValue, response: JSValue) {
        let pendingIndexAsInt = Int(pendingIndex.toInt32())
        if (error.isNull == false) {
            pendingPromises[pendingIndexAsInt]?.reject(JSContextError(message: error.toString()))
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
            self.runScript("hybrid.promiseBridgeBackToNative(" + String(pendingIndex) + "," + js + ");")
            .error { err in
                reject(err)
            }
        }
    }
    
    func dispatchExtendableEvent(name: String, data: Mappable?) -> Promise<JSValue> {
        return self.executeJSPromise("hybrid.dispatchExtendableEvent('" + name + "')")
    }
    
    func loadServiceWorker(workerJS:String) -> Promise<JSValue> {
        return self.loadContextScript()
        .then {_ in 
            self.runScript(workerJS)
        }
    }
    

    
//    func executeSqlQueries(dbName:JSValue, queries:JSValue, readOnly:JSValue) -> [String] {
//        let queryMapper = Mapper<WebSQLQuery>()
//        let queriesAsObjects = queryMapper.mapArray(queries.toString())!
//        
//        let urlComponents = NSURLComponents(string: self.url)!
//        urlComponents.path = nil
//        
//        let origin = urlComponents.URLString
//        do {
//            let results = try WebSQL.exec(dbName.toString(), queries: queriesAsObjects, readOnly: readOnly.toBool(), origin: origin)
//            
//            let resultsAsJSONArray = Mapper().toJSONString(results)!
//            // can't use [String?] for some Objective-C related reason, so we
//            // have to set something else as null.
//            return ["__NULL__", resultsAsJSONArray]
//        } catch {
//            
//            return [String(error), "__NULL__"]
//        }
//        
//    }
    
    private func loadContextScript() -> Promise<JSValue> {
        
        return Promise<String> {fulfill, reject in
            let workerContextPath = NSBundle.mainBundle().pathForResource("worker-context", ofType: "js", inDirectory: "js-dist")!
            let contextJS = try NSString(contentsOfFile: workerContextPath, encoding: NSUTF8StringEncoding) as String
            fulfill(contextJS)
        }.then { js in
            return self.runScript("var self = {}; var global = {}; hybrid = {};" + js)
        }.then { js in
            
            // JSContext doesn't have a 'global' variable so instead we make our own,
            // then go through and manually declare global variables.
            
            let keys = self.jsContext.evaluateScript("Object.keys(global);").toArray()
            var globalsScript = ""
            for key in keys {
                let keyAsString = key as! String
                globalsScript += "var " + keyAsString + " = global['" + keyAsString + "'];";
            }
            return self.runScript(globalsScript)
        }
    }
    
    func runScript(js: String) -> Promise<JSValue> {
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
    
    
    func exceptionHandler(context:JSContext!, exception:JSValue!) {
        self.contextErrorValue = exception
        log.error("JSCONTEXT error: " + exception.toString())
    }
}