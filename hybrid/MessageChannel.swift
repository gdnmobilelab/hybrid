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


@objc protocol MessageEventExports : JSExport {
    var data:String {get}
    var ports:[MessagePort] {get}
    init(data:String?, ports:[MessagePort]?)
}

@objc public class MessageEvent : NSObject, MessageEventExports {
    var data:String
    var ports:[MessagePort]
    var fromWebView:WKWebView?
    

    public required init(data:String?, ports: [MessagePort]?) {
      
        if data != nil {
            self.data = data!
        } else {
            self.data = ""
        }
       
        if ports != nil {
            self.ports = ports!
        } else {
            self.ports = [MessagePort]()
        }
        
        self.fromWebView = nil
        super.init()

    }
    
    
    init(data:String, ports:[MessagePort], fromWebView:WKWebView?) {
        self.data = data
        self.ports = ports
        
        // We use this to make sure we aren't echoing messages back to the
        // webview that sent them.
        self.fromWebView = fromWebView
        super.init()
    }
}

@objc protocol MessagePortExports : JSExport {
    func postMessage(message:JSValue, ports: [MessagePort]) -> Void
    func postMessage(message:JSValue) -> Void
    var onmessage:JSValue? {get set }
    init()
}

class CannotConvertToJSONError: ErrorType {}

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
    
    func jsValueToString(val:JSValue) throws -> String {
        if val.isString == true {
            return val.toString()
        }
        
        var converted:AnyObject?
        
        if val.isObject == true {
            converted = val.toObject()
        }
        if val.isArray == true {
            converted = val.toArray()
        }
        if val.isNumber == true {
            return String(val.toNumber())
        }
        
        if converted == nil {
            throw CannotConvertToJSONError()
        }
        let data = try NSJSONSerialization.dataWithJSONObject(converted!, options: NSJSONWritingOptions())
        return String(data: data, encoding: NSUTF8StringEncoding)!
    }
    
    func postMessage(data: JSValue) {
        self.postMessage(data, ports: [], fromWebView: nil)
    }
    
    func postMessage(data:JSValue, ports:[MessagePort]) {
        self.postMessage(data, ports: ports, fromWebView: nil)
    }
    func postMessage(data:JSValue, ports:[MessagePort], fromWebView:WKWebView?) {
        
        do {
            let converted = try self.jsValueToString(data)
            self.postStringMessage(converted, ports: ports, fromWebView: fromWebView)
        } catch {
            log.error("JSValue conversion FAILED: " + String(error))
        }
    }
    
    func postStringMessage(message:String, ports:[MessagePort] = [], fromWebView:WKWebView? = nil) {
        self.eventEmitter.emit("emit", MessageEvent(data: message, ports: ports,fromWebView: fromWebView))
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
