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



@objc protocol MessageEventExports {
    var data:String {get}
    var ports:[MessagePort] {get}
}

@objc class MessageEvent : NSObject, MessageEventExports {
    var data:String
    var ports:[MessagePort]
    var fromWebView:WKWebView?
    
    init(data:String, ports:[MessagePort] = [], fromWebView:WKWebView? = nil) {
        self.data = data
        self.ports = ports
        
        // We use this to make sure we aren't echoing messages back to the
        // webview that sent them.
        self.fromWebView = fromWebView
    }
}

@objc protocol MessagePortExports : JSExport {
    func postMessage(message:String, ports: [MessagePort]) -> Void
    func postMessage(message:String) -> Void
    var onmessage:JSValue? {get set }
    init()
}

@objc public class MessagePort : NSObject, MessagePortExports {
    
    let eventEmitter = Event<MessageEvent>()
    private var messageListener:Listener?
    dynamic var onmessage:JSValue?
    
    
    override required public init() {
        super.init()
        self.messageListener = self.eventEmitter.on("message", self.handleMessage)
    }
    
    
    private func handleMessage(message:MessageEvent) {
        
        if self.onmessage == nil {
            return
        }
        
        onmessage!.callWithArguments([message])
    }
    
    func postMessage(data: String) {
        self.eventEmitter.emit("emit", MessageEvent(data: data, ports: []))
    }
    
    func postMessage(data:String, ports:[MessagePort]) {
        self.eventEmitter.emit("emit", MessageEvent(data: data, ports: ports))
    }
    func postMessage(data:String, ports:[MessagePort], fromWebView:WKWebView) {
        self.eventEmitter.emit("emit", MessageEvent(data: data, ports: ports,fromWebView: fromWebView))
    }
}

@objc protocol MessageChannelExports : JSExport {
    var port1:MessagePort {get}
    var port2:MessagePort {get}
    init()
}

@objc class MessageChannel : NSObject, MessageChannelExports {
    dynamic var port1 = MessagePort()
    dynamic var port2 = MessagePort()
    
    private var listener1:Listener?
    private var listener2:Listener?
    
    override required init() {
        super.init()
        self.listener1 = port1.eventEmitter.on("emit", { (msg: MessageEvent) in
            self.port2.eventEmitter.emit("message", msg)
        })
        
        self.listener2 = port2.eventEmitter.on("emit", { (msg: MessageEvent) in
            self.port1.eventEmitter.emit("message", msg)
        })
        
    }
}