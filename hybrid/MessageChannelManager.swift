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

class MessagePortMessage : JSONSerializable {
    
    func toSerializableObject() -> [String: AnyObject] {
        return [
            "data": self.data,
            "passedPortIds": self.passedPortIds
        ]
    }
    
    var data:String!
    var passedPortIds:[Int]!

    init(data:String, passedPortIds:[Int]) {
        self.data = data
        self.passedPortIds = passedPortIds
    }
    
}

// We don't have access to the JSContext of WKWebViews, and can only communicate
// via message handlers. So we need to keep references to our message channels
// on the native side, and provide simple identifiers to the WKWebView itself.

// TODO: how do we tidy these up when we're done? We're not aware on the native
// side when a channel is finished with.


class MessageChannelManager: ScriptMessageManager {
    
    var activePorts = [Int: MessagePort]()
    var portListeners = [Int:Listener]()
    var onMessage: ((String, [MessagePort]) -> Void)? = nil
    
    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "messageChannel")
    }
    
    override func handleMessage(message:AnyObject) -> Promise<String>? {
       
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
            
            self.sendToPort(index, data: data, additionalPortIndexes: additionalPortIndexes)
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
    
    func sendToPort(portIndex:Int, data:String, additionalPortIndexes:[Int]) {
        let port = self.activePorts[portIndex]
        
        if port == nil {
            log.error("Tried to send on a message port that doesn't exist")
            return
        }
        
        let portsFromIndexes = additionalPortIndexes.map { (index: Int) -> MessagePort in
            return self.activePorts[index]!
        }
        
        port!.postStringMessage(data, ports: portsFromIndexes, fromWebView: self.webview)
    }
    
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
        self.activePorts[index] = port
        
        self.portListeners[index] = port.eventEmitter.on("emit", { msg in
            
            if msg.fromWebView != nil && msg.fromWebView! == self.webview {
                // If the message originated from this webview we don't want
                // to echo it straight back again.
                return
            }
            
            let portsAsIndexes = msg.ports.map({ port in
                return self.manuallyAddPort(port)
            })
            
            let objToPass = MessagePortMessage(data: msg.data, passedPortIds: portsAsIndexes)
            
            let asString = JSONSerializable.serialize(objToPass.toSerializableObject())
            
            self.webview.evaluateJavaScript("window.__messageChannelBridge.emit('emit'," + String(index) + "," + asString! + ")", completionHandler: nil)
        })
        
        return index

    }
    
    func createNewPort() -> Int {
        return self.manuallyAddPort(MessagePort())
    }
    
    func deletePort(index:Int) {
        self.activePorts.removeValueForKey(index)
        self.portListeners.removeValueForKey(index)
    }
}
