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
    
    @objc public init(id: String, url: URL, registration: ServiceWorkerRegistrationProtocol) {
        self.id = id
        self.url = url
        self.registration = registration
        super.init()
    }
    
    fileprivate var isDestroyed = false
    @objc public func destroy() {
        self.isDestroyed = true
        self.executionEnvironment.destroy()
    }
    
    @objc lazy public var executionEnvironment:ServiceWorkerExecutionEnvironment = {
        
        // Being lazy means that we can create instances of ServiceWorker whenever we feel
        // like it (like, say, when ServiceWorkerRegistration is populating active, waiting etc)
        // without incurring a huge penalty for doing so.
        
        Log.info?("Creating execution environment for worker: " + self.id)
        
        return ServiceWorkerExecutionEnvironment(self)
        
    }()
    
    @objc func dispatchEvent(_ event:Event) {
        if self.isDestroyed {
            Log.error?("Tried to dispatch event in a destroyed worker")
            return
        }
        self.executionEnvironment.globalScope.dispatchEvent(event)
    }
    
    
    /// The Service Worker API requires that we cache imported scripts as part of the loading
    /// process. But because we want this implementation to be self-contained, we provide this
    /// hook for another module (i.e. ServiceWorkerContainer) to actually implement importing.
    public var importScripts: (ServiceWorker, [URL]) throws -> [String] = ServiceWorker.importScriptsDefault
    
    fileprivate static func importScriptsDefault(worker: ServiceWorker, scripts: [URL]) throws -> [String] {
        throw ErrorMessage("You must provide an importScripts implementation on ServiceWorker")
    }
    
    
}
