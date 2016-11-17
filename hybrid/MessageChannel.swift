//
//  MessageChannel.swift
//  hybrid
//
//  Created by alastair.coote on 09/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import EmitterKit
import WebKit
import JavaScriptCore


@objc protocol ExtendableMessageEventExports : JSExport {
    var data:AnyObject? {get}
    var ports:[MessagePort] {get}
    init(data:AnyObject?, ports:[MessagePort]?)
}


/// Implementation of browser ExtendableMessageEvent: https://developer.mozilla.org/en-US/docs/Web/API/ExtendableMessageEvent
@objc class ExtendableMessageEvent : ExtendableEvent, ExtendableMessageEventExports {
    var data:AnyObject?
    var ports:[MessagePort]
    
    /// We use this to make sure we aren't echoing messages back to the
    /// webview that sent them. Need to look at the logic of this because
    /// it doesn't make a lot of sense that it would ever do that
    var fromWebView:WKWebView?
    
    required init(data:AnyObject?, ports: [MessagePort]?) {
      
        self.data = data
       
        if ports != nil {
            self.ports = ports!
        } else {
            self.ports = [MessagePort]()
        }
        
        self.fromWebView = nil
        super.init(type: "message")

    }
    
    
    init(data:AnyObject?, ports:[MessagePort], fromWebView:WKWebView?) {
        self.data = data
        self.ports = ports
        
        self.fromWebView = fromWebView
        super.init(type: "message")
    }
    
    required init(type: String) {
        fatalError("ExtendableMessageEvent must be created with data, ports initializer")
    }
}

@objc protocol MessagePortExports : JSExport {
    func postMessage(message:AnyObject, ports: [MessagePort]) -> Void
    func postMessage(message:AnyObject) -> Void
    var onmessage:JSValue? {get set }
    init()
}

/// An implementation of MessagePort: https://developer.mozilla.org/en-US/docs/Web/API/MessagePort
@objc public class MessagePort : NSObject, MessagePortExports {
    
    let eventEmitter = Event<ExtendableMessageEvent>()
    private var messageListener:Listener?
    
    /// Required for JS compatibility - you can use both addEventListener() and onmessage in JS contexts
    var onmessage:JSValue?
    
    override required public init() {
        super.init()
        self.messageListener = self.eventEmitter.on("message", self.handleMessage)
    }
    
    
    /// Attached to the eventEmitter to listen for incoming ExtendableMessageEvents
    ///
    /// - Parameter message: The message we want to pass onto our onmessage handler
    private func handleMessage(message:ExtendableMessageEvent) {
        
        if self.onmessage == nil {
            return
        }
        
        onmessage!.callWithArguments([message])
    }
    
    func postMessage(data: AnyObject) {
        self.postMessage(data, ports: [], fromWebView: nil)
    }
    
    func postMessage(data:AnyObject, ports:[MessagePort]) {
        self.postMessage(data, ports: ports, fromWebView: nil)
    }
    func postMessage(data:AnyObject, ports:[MessagePort], fromWebView:WKWebView?) {
        self.eventEmitter.emit("emit", ExtendableMessageEvent(data: data, ports: ports,fromWebView: fromWebView))
    }
    
}

@objc protocol MessageChannelExports : JSExport {
    var port1:MessagePort {get}
    var port2:MessagePort {get}
    init()
}


/// Implementation of MessageChannel: https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel
/// Basically just a pairing of two MessagePorts - postMessage-ing into one triggers a message event on the other.
@objc class MessageChannel : NSObject, MessageChannelExports {
    dynamic var port1 = MessagePort()
    dynamic var port2 = MessagePort()
    
    private var listener1:Listener?
    private var listener2:Listener?
    
    override required init() {
        super.init()
        self.listener1 = port1.eventEmitter.on("emit", { (msg: ExtendableMessageEvent) in
            self.port2.eventEmitter.emit("message", msg)
        })
        
        self.listener2 = port2.eventEmitter.on("emit", { (msg: ExtendableMessageEvent) in
            self.port1.eventEmitter.emit("message", msg)
        })
        
    }
}
