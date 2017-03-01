//
//  ServiceWorkerProxy.swift
//  hybrid
//
//  Created by alastair.coote on 21/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker
import HybridShared
import PromiseKit

class ServiceWorkerProxy: NSObject, HybridMessageReceiver {
    
    let instance: ServiceWorkerInstance
    let messageHandler: HybridMessageManager
    var stateChangeListener: Listener<StateChangeEvent>?
    
    init (_ instance: ServiceWorkerInstance, messageHandler: HybridMessageManager) {
        self.instance = instance
        self.messageHandler = messageHandler
        super.init()
        self.stateChangeListener = self.instance.addEventListener(self.stateChange)
    }
    
    func stateChange(_ ev: StateChangeEvent) {
        
        let cmd = ItemEventCommand(target: self, eventName: "statechange", data: self.instance.state)
        
        self.messageHandler.sendCommand(cmd)
        
    }
    
    static let jsClassName = "ServiceWorker"
    
    static func createFromJSArguments(args: [Any?], from: HybridMessageManager) throws -> HybridMessageReceiver {
        throw ErrorMessage("New workers cannot be created within JS environment")
    }
    
    func getArgumentsForJSMirror() throws -> [Any?] {
        return [self.instance.url.absoluteString, self.instance.state]
    }
    
    func unload() {
        self.instance.removeEventListener(self.stateChangeListener!)
    }
    
    
    /// The proxy normally has a 1:1 relationship between 
    var connectedMessageHandlers = Set<HybridMessageManager>()
    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>? {
        
        if msg.command == "registerforevents" {
            
        }
        
        return Promise(value: ())
    }
}
