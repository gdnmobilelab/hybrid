//
//  ServiceWorker.swift
//  ServiceWorker
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

@objc public class ServiceWorker : NSObject {
    
    public let url:URL
    public let id:String
    let registration: ServiceWorkerRegistrationProtocol
    let loadContent: (ServiceWorker) -> String
    
    public var state:ServiceWorkerInstallState
    
    public init(id: String, url: URL, registration: ServiceWorkerRegistrationProtocol, state:ServiceWorkerInstallState, loadContent: @escaping (ServiceWorker) -> String) {
        self.id = id
        self.url = url
        self.registration = registration
        self.loadContent = loadContent
        self.state = state
        super.init()
    }
    
    public init(id: String, url: URL, registration: ServiceWorkerRegistrationProtocol, state:ServiceWorkerInstallState, content: String) {
        self.id = id
        self.url = url
        self.registration = registration
        self.loadContent = { worker in
            return content
        }
        self.state = state
        super.init()
    }
    
    fileprivate var isDestroyed = false
    public func destroy() {
        self.isDestroyed = true
        self.executionEnvironment.destroy()
    }
    
    lazy public var executionEnvironment:ServiceWorkerExecutionEnvironment = {
        
        // Being lazy means that we can create instances of ServiceWorker whenever we feel
        // like it (like, say, when ServiceWorkerRegistration is populating active, waiting etc)
        // without incurring a huge penalty for doing so.
        
        Log.info?("Creating execution environment for worker: " + self.id)
        
        let env = ServiceWorkerExecutionEnvironment(self)
        let script = self.loadContent(self)
        let load = env.jsContext.evaluateScript(script, withSourceURL: self.url)
        let test = load?.toString()
        env.jsContext.exception = env.currentException
        return env
        
    }()
    
    public func dispatchEvent(_ event:Event) throws {
        if self.isDestroyed {
            throw ErrorMessage("Tried to dispatch event in a destroyed worker")
        }
        if self.executionEnvironment.currentException != nil {
            throw ErrorMessage("Cannot dispatch event: context is in error state")
        }
        self.executionEnvironment.globalScope.dispatchEvent(event)
    }
    
    public var skipWaitingStatus:Bool {
        get {
            return self.executionEnvironment.globalScope.skipWaitingStatus
        }
    }
    
    
    /// The Service Worker API requires that we cache imported scripts as part of the loading
    /// process. But because we want this implementation to be self-contained, we provide this
    /// hook for another module (i.e. ServiceWorkerContainer) to actually implement importing.
    public var importScripts: (ServiceWorker, [URL]) throws -> [String] = ServiceWorker.importScriptsDefault
    
    fileprivate static func importScriptsDefault(worker: ServiceWorker, scripts: [URL]) throws -> [String] {
        throw ErrorMessage("You must provide an importScripts implementation on ServiceWorker")
    }
    
    
}
