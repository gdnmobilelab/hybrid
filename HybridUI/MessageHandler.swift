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

fileprivate let ConnectedItemTypes: [HybridMessageReceiver.Type] = [
    ServiceWorkerContainer.self
]

/// A bridge between our native code and WKWebView script, that allows us to store promises, run code
/// asynchonously on the native side, then resolve the original promise in the web client.
class HybridMessageManager: NSObject, WKScriptMessageHandler {
    
    var connectedItems = [Int : HybridMessageReceiver]()
    var webview: HybridWebview?
    let delayedPromiseStore = DelayedPromiseStore()
   
    func addNewConnectedItem(_ receiver: HybridMessageReceiver) -> Int {
        
        let newIndex = connectedItems.count
        self.connectedItems[newIndex] = receiver
        
        return newIndex
    }

    
    func sendCommandAwaitResponse(_ command: BridgeCommand) -> Promise<Any?> {
        
        return Promise(value: ())
        .then { () -> Promise<Any?> in
            
            let serializedJSON = try ReturnSerializer.serializeToJSON(command.getPayload(), manager: self)
            let js = "window.webkit.messageHandlers.hybrid.receiveCommand(\(serializedJSON));"
            
            return self.webview!.evaluateJavaScriptAndCatchError(js)
            .then { returnValue -> Promise<Any?> in
                
                let returnObject = returnValue as? [String: Any]
                
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
    
    func resolvePromise(_ body: [String: Any]) -> Promise<Any?> {
        
        let promiseId = body["promiseId"] as! Int
        let data = body["value"]
        let error = body["error"] as? String
        
        let errorInstance:Error? = error != nil ? ErrorMessage(error!) : nil
        
        self.delayedPromiseStore.resolve(forId: promiseId, error: errorInstance, data: data)
        
        return Promise(value: nil)
    }
    
    func sendToItem(_ body: [String: Any]) throws -> Promise<Any?> {
        
        let targetItemId = body["targetItemId"] as? Int
        
        if targetItemId == nil {
            throw ErrorMessage("Tried to send a sendtoitem event, but did not include a targetItemId")
        }
        
        if self.connectedItems[targetItemId!] == nil {
            throw ErrorMessage("Tried to send a sendtoitem event, but the target ID does not exist")
        }
        
        let targetItem = self.connectedItems[targetItemId!]!
        
        let nativeEvent = body["data"] as! [String: Any?]
        
        let commandName = nativeEvent["name"] as! String
        let commandData = nativeEvent["data"]!
        
        let maybePromise = targetItem.receiveMessage(WebviewMessage(command: commandName, data: commandData, webview: self.webview!))
        
        if maybePromise == nil {
            return Promise(value: nil)
        }
        
        return maybePromise!
//        .then { returnData in
//            self.sendCommand(ResolvePromiseCommand(data: returnData, promiseId: promiseId, error: nil))
//        }
        
    }
    
    func createBridgeItem(_ body: [String: Any]) throws -> Promise<Any?> {
        
        let data = body["data"] as! [String:Any]
        
        let bridgeItemType = data["className"] as! String
        let initializeArguments = data["args"] as! [Any?]
        let indexOfNewItem = data["itemIndex"] as! Int
        
        let targetClass = ConnectedItemTypes.filter { $0.jsClassName == bridgeItemType }.first
        
        if targetClass == nil {
            throw ErrorMessage("Did not recognise class type " + bridgeItemType)
        }
        
        let newItem = try targetClass!.createFromJSArguments(args: initializeArguments, from: self)
        
        if self.connectedItems[indexOfNewItem] != nil {
            throw ErrorMessage("Item already exists at this index.")
        }
        
        self.connectedItems[indexOfNewItem] = newItem
        
        return Promise(value: newItem)
        
    }
    
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        
        let body = message.body as? [String: Any]
        
        if body == nil {
            // message is a string, integer or something
            log.error("Could not understand the received message: " + String(describing: message.body))
            return
        }
        
        let command = body!["command"] as! String
        let promiseId = body!["storedResolveId"] as! Int
        
        _ = Promise(value:())
        .then { () -> Promise<Any?> in
            if command == "resolvepromise" {
                return self.resolvePromise(body!)
            }
            
            if command == "sendtoitem" {
                return try self.sendToItem(body!)
            }
            
            if command == "createbridgeitem" {
                return try self.createBridgeItem(body!)
            }
            
            if command == "clearbridgeitems" {
                self.connectedItems.removeAll()
                return Promise(value: ())
            }
            
            throw ErrorMessage("Do not understand command " + command)
            
        }
        .then { response in
            return ResolvePromiseCommand(data: response, promiseId: promiseId, error: nil)
        }
        .recover { error in
            return ResolvePromiseCommand(data: nil, promiseId: promiseId, error: error)
        }
        .then { cmd in
            self.sendCommand(cmd)
        }

    }
    
    
    
    
    
}
