//
//  MessageChannelHandler.swift
//  hybrid
//
//  Created by alastair.coote on 09/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import PromiseKit
import EmitterKit

/// A Serialization target for MessagePort messages when we are passing them back into a WKWebView.
class MessagePortMessage {
    
    
    /// Turn into a simple object that can be serialized to JSON.
    func toSerializableObject() -> [String: AnyObject] {
        return [
            "data": self.data != nil ? self.data! : NSNull(),
            "passedPortIds": self.passedPortIds
        ]
    }
    
    let data:AnyObject?
    
    /// We can't pass MessagePorts themselves into the WKWebView, so instead we keep track of the port
    /// IDs we're sending, and using the JS bridge to communicate between native and web.
    var passedPortIds:[Int]!

    init(data:AnyObject?, passedPortIds:[Int]) {
        self.data = data
        self.passedPortIds = passedPortIds
    }
    
}


/// We don't have access to the JSContext of WKWebViews, and can only communicate
/// via message handlers. So we need to keep references to our message channels
/// on the native side, and provide simple identifiers to the WKWebView itself.
///
/// TODO: how do we tidy these up when we're done? We're not aware on the native
/// side when a channel is finished with.
class MessageChannelManager: ScriptMessageManager {
    
    var activePorts = [Int: MessagePort]()
    var portListeners = [Int:Listener]()
    var closeListeners = [Int:Listener]()
    var onMessage: ((AnyObject, [MessagePort]) -> Void)? = nil
    
    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "messageChannel")
    }
    
    
    /// Handle operations sent from within the WKWebView.
    ///
    /// - Parameter message: Message object. Must have key named "operation" with value of create, delete, sendToPort or postMessage
    /// - Returns: nil, unless the operation is "create", in which case it returns the new ID as a string
    override func handleMessage(message:AnyObject) -> Promise<String>? {
        log.info("AN OPERATION!")
        let operation = message["operation"] as! String
        if (operation == "create") {
            let newId = self.createNewPort()
            return Promise<String>(String(newId))
        }
        if (operation == "delete") {
            let index = message["portIndex"] as! Int
            self.deletePort(index)
            return nil
        }
        if (operation == "sendToPort") {
            let index = message["portIndex"] as! Int
            let data = message["data"] as! String
            let additionalPortIndexes = message["additionalPortIndexes"] as! [Int]
            
            self.sendToPort(index, jsonString: data, additionalPortIndexes: additionalPortIndexes)
            return nil
        }
        if (operation == "postMessage") {
            if self.onMessage == nil {
                return nil
            }
            let data = message["data"] as! String
            let additionalPortIndexes = message["additionalPortIndexes"] as! [Int]
            let actualPorts = additionalPortIndexes.map({ index in
                return self.activePorts[index]!
            })
            
            self.onMessage!(data, actualPorts)
            return nil
        }
        log.error("Operation not supported: " + operation)
        return nil
    }
    
    
    /// Send a message to one of the ports in our saved port collection
    ///
    /// - Parameters:
    ///   - portIndex: The index of the port to send to
    ///   - data: The data to send - a string, usually a JSON string, but not necessarily
    ///   - additionalPortIndexes: The additional ports to attach to postMessage() as a secondary argument
    func sendToPort(portIndex:Int, jsonString:String, additionalPortIndexes:[Int]) {
        let port = self.activePorts[portIndex]
        
        if port == nil {
            log.error("Tried to send on a message port that doesn't exist")
            return
        }
        
        log.info("ports?")
        let portsFromIndexes = additionalPortIndexes.map { (index: Int) -> MessagePort in
            return self.activePorts[index]!
        }
        log.info("ports!")
        do {
            let data = try NSJSONSerialization.JSONObjectWithData(jsonString.dataUsingEncoding(NSUTF8StringEncoding)!, options: [])
            port!.postMessage(data, ports: portsFromIndexes, fromWebView: self.webview)
        } catch {
            log.error("Could not post JSON string: " + String(error))
        }
        
        
        
    }
    
    
    /// Only used in testing. Do not use in the app itself.
    ///
    /// - Parameter port: The port to add to our port collection
    /// - Returns: The new index for the port we've added
    func manuallyAddPort(port:MessagePort) -> Int {
        // only really called directly during testing
        
        for (index, iteratePort) in self.activePorts {
            
            // We don't ever want to add the same port twice. So if
            // it's already in the array, just return the existing index.
            
            if port == iteratePort {
                return index
            }
        }
        
        var index = 0
        while self.activePorts[index] != nil {
            index += 1
        }
        log.info("Manually adding MessagePort to index #" + String(index))
        self.activePorts[index] = port
        
        self.portListeners[index] = port.eventEmitter.on("emit", { msg in
           
            if msg!.fromWebView != nil && msg!.fromWebView! == self.webview {
                // If the message originated from this webview we don't want
                // to echo it straight back again.
                return
            }
            
            let portsAsIndexes = msg!.ports.map({ port in
                return self.manuallyAddPort(port)
            })
            
            let objToPass = MessagePortMessage(data: msg!.data, passedPortIds: portsAsIndexes)
            
            let asString = JSONSerializable.serialize(objToPass.toSerializableObject())
            port.pendingJSExecution = true
            self.webview.evaluateJavaScript("window.__messageChannelBridge.emit('emit'," + String(index) + "," + asString! + ")", completionHandler: { (_,_) in
                port.pendingJSExecution = false
            })
        })
        
        self.closeListeners[index] = port.eventEmitter.on("close", { _ in
            log.info("Port #" + String(index) + " closed, marking index for reuse")
            self.deletePort(index)
        })
        
        return index

    }
    
    /// Create a new port and add it to the store
    ///
    /// - Returns: The index of the newly created port
    func createNewPort() -> Int {
        return self.manuallyAddPort(MessagePort())
    }
    
    
    /// Remove a port from the store
    ///
    /// - Parameter index: The index of the port to remove
    func deletePort(index:Int) {
        log.info("Deleting port #" + String(index))
        
        self.activePorts.removeValueForKey(index)
        self.portListeners.removeValueForKey(index)
        self.closeListeners.removeValueForKey(index)
        
        self.webview.evaluateJavaScript("window.__messageChannelBridge.emit('delete'," + String(index) + ")", completionHandler: nil)
    }
}
