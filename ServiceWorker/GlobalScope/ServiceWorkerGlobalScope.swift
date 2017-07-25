//
//  ServiceWorkerGlobalScope.swift
//  ServiceWorker
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

@objc protocol ServiceWorkerGlobalScopeExports : JSExport {
    var registration:ServiceWorkerRegistrationProtocol { get }
    func skipWaiting()
    func importScripts(_: JSValue)
}

@objc class ServiceWorkerGlobalScope : EventTarget, ServiceWorkerGlobalScopeExports {
    
    let console:ConsoleMirror
    let worker: ServiceWorker
    let context:JSContext
    
    var skipWaitingStatus = false
    
    func skipWaiting() {
        self.skipWaitingStatus = true
    }
    
    var registration: ServiceWorkerRegistrationProtocol {
        get {
            return self.worker.registration
        }
    }
    
    init(context:JSContext, _ worker: ServiceWorker) {
        
        self.console = ConsoleMirror(console: context.objectForKeyedSubscript("console"))
        self.worker = worker
        self.context = context
        
        super.init()
        
        context.globalObject.setValue(self, forProperty: "self")
        context.globalObject.setValue(Event.self, forProperty: "Event")
        context.globalObject.setValue(self.skipWaiting as @convention(block) () -> Void, forProperty: "skipWaiting")
        
        let importAsConvention: @convention(block) (JSValue) -> Void = self.importScripts
        context.globalObject.setValue(importAsConvention, forProperty: "importScripts")
        
    }
    
    fileprivate func throwErrorIntoJSContext(error: Error) {
        var errMsg = String(describing: error)
        if let msg = error as? ErrorMessage {
            errMsg = msg.message
        }
        let err = JSValue(newErrorFromMessage: errMsg, in: self.context)
        self.context.exception = err
    }
    
    internal func importScripts(_ scripts: JSValue) {
        do {
            
            var scriptURLStrings: [String]
            
            // importScripts supports both single files and arrays
            if scripts.isArray {
                scriptURLStrings = scripts.toArray() as! [String]
            } else {
                scriptURLStrings = [scripts.toString()]
            }
            
            let scriptURLs = try scriptURLStrings.map { urlString -> URL in
                let asURL = URL(string: urlString, relativeTo: self.worker.url)
                if asURL == nil {
                    throw ErrorMessage("Could not parse URL: " + urlString)
                }
                return asURL!
            }
            
            let scripts = try self.worker.importScripts(self.worker, scriptURLs)
            
            scripts.enumerated().forEach { arg in
                self.context.evaluateScript(arg.element, withSourceURL: scriptURLs[arg.offset])
            }
            
            
        } catch {
            self.throwErrorIntoJSContext(error: error)
        }
    }
    
}
