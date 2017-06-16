//
//  ServiceWorker.swift
//  ServiceWorker
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore

public class ServiceWorker {
    
    public let url:URL
    public let id:String
    fileprivate let registration: ServiceWorkerRegistrationProtocol
    
    public init(id:String, url: URL, registration: ServiceWorkerRegistrationProtocol) {
        self.id = id
        self.url = url
        self.registration = registration
    }
    
    static public var logInterface:ServiceWorkerLogInterface {
        get {
            return Log
        }
        set(value) {
            Log = value
        }
    }
    
    static public var virtualMachine:JSVirtualMachine?
    
    lazy public var executionEnvironment:ServiceWorkerExecutionEnvironment = {
        
        // Being lazy means that we can create instances of ServiceWorker whenever we feel
        // like it (like, say, when ServiceWorkerRegistration is populating active, waiting etc)
        // without incurring a huge penalty for doing so.
        
        Log.info?("Creating execution environment for worker: " + self.id)
        
        return ServiceWorkerExecutionEnvironment()
        
    }()
    
    func dispatchEvent(_ event:Event) {
//        self.executionEnvironment.globalScope.dispatchEvent(event)
    }
    
    
}
