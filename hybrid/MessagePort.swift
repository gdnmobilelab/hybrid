//
//  MessagePort.swift
//  hybrid
//
//  Created by alastair.coote on 13/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import EmitterKit
import WebKit
import JavaScriptCore

@objc protocol MessagePortExports : JSExport {
    func postMessage(message:AnyObject, ports: [MessagePort]) -> Void
    func postMessage(message:AnyObject) -> Void
    func close() -> Void
    var onmessage:JSValue? {get set }
    init()
}

/// An implementation of MessagePort: https://developer.mozilla.org/en-US/docs/Web/API/MessagePort
@objc public class MessagePort : NSObject, MessagePortExports {
    
    let eventEmitter = Event<ExtendableMessageEvent?>()
    private var messageListener:Listener?
    
    private var _pendingJSExecution = false
    private var _pendingClose = false
    
    /// We track whether the port is pending execution inside a webview - this is used to
    /// stop from emitting close events too early.
    var pendingJSExecution: Bool {
        
        get {
            return self._pendingJSExecution
        }
        
        set(value) {
            self._pendingJSExecution = value
            if value == false && self._pendingClose {
                self._pendingClose = false
                self.close()
            }
        }
    }
    
    /// Required for JS compatibility - you can use both addEventListener() and onmessage in JS contexts
    var onmessage:JSValue?
    
    override required public init() {
        super.init()
        self.messageListener = self.eventEmitter.on("message", self.handleMessage)
    }
    
    
    /// Attached to the eventEmitter to listen for incoming ExtendableMessageEvents
    ///
    /// - Parameter message: The message we want to pass onto our onmessage handler
    private func handleMessage(message:ExtendableMessageEvent?) {
        
        if self.onmessage == nil {
            return
        }
        
        onmessage!.callWithArguments([message!])
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
    
    func close() {
        if self._pendingJSExecution {
            self._pendingClose = true
        } else {
            self.eventEmitter.emit("close", nil)
        }
    }
    
}
