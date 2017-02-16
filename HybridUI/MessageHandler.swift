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
            let js = "window.webkit.messageHandlers.hybrid.bridge.receiveCommand(\(serializedJSON));"
            
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
    }
    
    func getIndexForExistingConnectedItem( _ item: HybridMessageReceiver) -> Int? {
        
        let existing = connectedItems.filter { $1.hashValue == item.hashValue }.first
        return existing?.key
        
    }
    
    func resolvePromise(_ body: [String: Any]) {
        
        let promiseId = body["promiseId"] as! Int
        let data = body["value"]
        let error = body["error"] as? String
        
        let errorInstance:Error? = error != nil ? ErrorMessage(error!) : nil
        
        self.delayedPromiseStore.resolve(forId: promiseId, error: errorInstance, data: data)
        
    }
    
    func sendToItem(_ body: [String: Any]) {
        
        let targetItemId = body["targetItemId"] as? Int
        
        if targetItemId == nil {
            log.error("Tried to send a sendtoitem event, but did not include a targetItemId")
            return
        }
        
        if self.connectedItems[targetItemId!] == nil {
            log.error("Tried to send a sendtoitem event, but the target ID does not exist")
            return
        }
        
        let targetItem = self.connectedItems[targetItemId!]!
        
        let promiseId = body["storedResolveId"] as! Int
        
        let nativeEvent = body["data"] as! [String: Any?]
        
        let commandName = nativeEvent["name"] as! String
        let commandData = nativeEvent["data"]
        
        let maybePromise = targetItem.receiveMessage(WebviewMessage(command: commandName, data: commandData, webview: self.webview!))
        
        if maybePromise == nil {
            self.sendCommand(ResolvePromiseCommand(data: nil, promiseId: promiseId, error: nil))
            return
        }
        
        maybePromise!
        .then { returnData in
            self.sendCommand(ResolvePromiseCommand(data: returnData, promiseId: promiseId, error: nil))
        }
        .catch { error in
            self.sendCommand(ResolvePromiseCommand(data: nil, promiseId: promiseId, error: error))
        }
        
    }
    
    
    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        
        let body = message.body as? [String: Any]
        
        if body == nil {
            // message is a string, integer or something
            log.error("Could not understand the received message: " + String(describing: message.body))
            return
        }
        
        let command = body!["command"] as! String
        
        if command == "resolvepromise" {
            return self.resolvePromise(body!)
        }
        
        if command == "sendtoitem" {
            return self.sendToItem(body!)
        }
        
        
        let target = body!["targetIndex"] as! Int
        let data = body!["data"]
        
        // Commands can return promises, but don't have to. If promiseIndex has been passed
        // then we know the JS command is expecting a response.
        let promiseReturnIndex = body!["promiseIndex"] as? Int
        
        let msg = WebviewMessage(command: command, data: data, webview: self.webview!)
        
        let itemToSendTo = self.connectedItems[target]
        
        if itemToSendTo == nil {
            log.error("No handler is registered for index #" + String(target))
            return
        }
        
        let returnPromise = itemToSendTo!.receiveMessage(msg)
        
        if returnPromise != nil && promiseReturnIndex == nil {
            
            // It's possible for our Swift command to return a promise when we're not expecting it.
            // Nothing we can really do in that scenario, except log that it happened.
            
            log.error("Receiver wants to send back a message, but the webview did not assign a promise return index")
            return
            
        } else if let promise = returnPromise {
            
            // If the command did return a promise, then we wait for that promise to resolve, and send
            // the return data (if there is any) back into the webview
            
            _ = promise.then { returnData -> Promise<Void> in
                
                var returnAsJSON = ""
                
                if let returnDataExists = returnData {
                    
                    // It's possible to use a promise simply to wait for an async operation to complete
                    // without actually returning any data. But if it does have any data, serialise it into
                    // JSON when we return the JS function.
                    
                    let returnAsData = try JSONSerialization.data(withJSONObject: returnDataExists, options: [])
                    // Add the comma because this is the second argument we're passing in
                    returnAsJSON = ", " + String(data: returnAsData, encoding: String.Encoding.utf8)!
                }
               
                // This code is defined in our JS package. We add a custom function to the messageHandler created
                // by the WKWebView itself.
                
                let js = "window.webkit.messageHandlers.hybrid.promiseResponse(\(promiseReturnIndex)\(returnAsJSON));"
                
                return Promise(resolvers: { (resolve, reject) in
                    
                    self.webview!.evaluateJavaScript(js, completionHandler: { (response, error) in
                        if error != nil {
                            reject(error!)
                        } else {
                            resolve()
                        }
                    })
                    
                })
                
                
            }
            .catch { error in
                log.error("Encountered error when passing return data back to webview: " + String(describing: error))
            }
        }
    }
    
    
    
    
    
}
