//
//  MessageHandler.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import JavaScriptCore
import WebKit
import HybridShared

/// A bridge between our native code and WKWebView script, that allows us to store promises, run code
/// asynchonously on the native side, then resolve the original promise in the web client.
class HybridMessageManager: NSObject, WKScriptMessageHandler {
    
    fileprivate var connectedItems = [Int : HybridMessageReceiver]()
    var webview: HybridWebview?
    let delayedPromiseStore = DelayedPromiseStore()
    var serializer:Serializer?
    var deserializer:Deserializer?
    
    override init() {
        super.init()
        self.serializer = Serializer(self)
        self.deserializer = Deserializer(self)
    }
   
    func addNewConnectedItem(_ receiver: HybridMessageReceiver) throws -> Int {
        
        if self.getIndexForExistingConnectedItem(receiver) != nil {
            throw ErrorMessage("Item is already in connected items array")
        }
        
        let newIndex = connectedItems.count
        self.connectedItems[newIndex] = receiver
        log.info("WTFFFFFFFF")
        
        return newIndex
    }
    
    func getConnectedItemAtIndex(_ index:Int) -> HybridMessageReceiver? {
        return self.connectedItems[index]
    }

    
    func sendCommandAwaitResponse(_ command: BridgeCommand) -> Promise<Any?> {
        
        return Promise(value: ())
        .then { () -> Promise<Any?> in
            
            let serializedJSON = try self.serializer!.serializeToJSON(command.getPayload())
            let js = "window.webkit.messageHandlers.hybrid.receiveCommand(\(serializedJSON));"
            
            return self.webview!.evaluateJavaScriptAndCatchError(js)
            .then { returnValue -> Promise<Any?> in
                
                let returnObject = returnValue as? [String: Any?]
                
                if returnObject != nil {
                    
                    let returnType = returnObject!["type"] as! String
                    
                    if returnType == "promise" {
                        
                        let promiseId = returnObject!["promiseId"] as! Int
                        
                        return self.delayedPromiseStore.wait(forId: promiseId)
                        
                    }
                    
                }
                
                return Promise(value: nil)
            }
            
        }
        
    }
    
    func sendCommand(_ command: BridgeCommand) {
        _ = self.sendCommandAwaitResponse(command)
        .then { response -> Void in
            if response != nil {
                log.warning("Was not expecting a response to command, but received one: " + String(describing: response!))
            }
        }
        .catch { error in
            log.error(String(describing: error))
        }
    }
    
    func getIndexForExistingConnectedItem( _ item: HybridMessageReceiver) -> Int? {
        
        let existing = connectedItems.filter { $1.hashValue == item.hashValue }.first
        return existing?.key
        
    }
    
    func resolvePromise(_ body: [String: Any?]) -> Promise<Any?> {
        
        let promiseId = body["promiseId"] as! Int
        let data = body["value"]!
        let error = body["error"] as? String
        
        let errorInstance:Error? = error != nil ? ErrorMessage(error!) : nil
        
        self.delayedPromiseStore.resolve(forId: promiseId, error: errorInstance, data: data)
        
        return Promise(value: nil)
    }
    
    func sendToItem(_ body: [String: Any?]) throws -> Promise<Any?> {
        
        let nativeEvent = body["data"] as! [String: Any?]

        let targetItem = nativeEvent["target"] as! HybridMessageReceiver
        
        
        let commandName = nativeEvent["eventName"] as! String
        let commandData = nativeEvent["data"]!

        let maybePromise = targetItem.receiveMessage(WebviewMessage(command: commandName, data: commandData, messageHandler: self))
        
        if maybePromise == nil {
            return Promise(value: nil)
        }
        
        return maybePromise!
        
    }
    

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        
        let body = message.body as? [String: Any?]
        
        if body == nil {
            // message is a string, integer or something
            log.error("Could not understand the received message: " + String(describing: message.body))
            return
        }

        _ = Promise(value:())
        .then { () -> Promise<Void> in
            
            let deserializedBody = try self.deserializer!.deserialize(body!) as! [String: Any?]
            
            let command = deserializedBody["command"] as! String
            let promiseId = deserializedBody["storedResolveId"] as! Int
    
            return Promise(value:())
            .then { () -> Promise<Any?> in
                
                if command == "resolvepromise" {
                    return self.resolvePromise(deserializedBody)
                }

                if command == "connectproxyitem" {
                    
                    let doubleSerializedItem = deserializedBody["data"] as! [String: Any?]
                    
                    let deserialized = try self.deserializer!.deserialize(doubleSerializedItem) as! HybridMessageReceiver
                    
                    let index = self.getIndexForExistingConnectedItem(deserialized)!
                    
                    return Promise(value: index)
                }
    
                if command == "sendtoitem" {
                    return try self.sendToItem(deserializedBody)
                }
    
                if command == "clearbridgeitems" {
                    self.connectedItems.forEach { $1.unload() }
                    self.connectedItems = [Int: HybridMessageReceiver]()
                    return Promise(value: nil)
                }

                throw ErrorMessage("Do not understand command " + command)
 
            }
            .then { response  in
                return ResolvePromiseCommand(data: response, promiseId: promiseId, error: nil)
            }
            .recover { error in
                return ResolvePromiseCommand(data: nil, promiseId: promiseId, error: error)
            }
            .then { cmd in
                
                if promiseId == -1 {
                    
                    // The JS function isn't expecting a return. We do this with things like console.log to avoid 
                    // unncessary promise bridging when we don't need it.
                    
                    if cmd.error != nil {
                        log.error("Encountered error but JS wasn't expecting return: " + String(describing: cmd.error!))
                    }
                    
                    if cmd.data != nil {
                        log.error("Received a response but JS wasn't expecting return: " + String(describing: cmd.data!))
                    }
                } else {
                    self.sendCommand(cmd)

                }
                
                return Promise(value: ())
            }
            
        }
        .catch { error in
            log.error("Failed to process webview message")
        }
        
       
    }
    
    
    
    
    
}
