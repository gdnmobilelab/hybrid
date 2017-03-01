//
//  MessagePort.swift
//  hybrid
//
//  Created by alastair.coote on 13/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import JavaScriptCore
import HybridShared

@objc protocol MessagePortExports : JSExport {
    func postMessage(_ message:Any, ports: [MessagePort]) -> Void
    func postMessage(_ message:Any) -> Void
    func close() -> Void
    var onmessage:JSValue? {get set }
    init()
}

/// An implementation of MessagePort: https://developer.mozilla.org/en-US/docs/Web/API/MessagePort
@objc public class MessagePort : JSEventEmitter, MessagePortExports {
    
    fileprivate var messageListener:Listener<ExtendableMessageEvent>?
    
    fileprivate var _pendingJSExecution = false
    fileprivate var _pendingClose = false
    
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
        self.messageListener = self.addEventListener(self.handleMessage)
    }
    
    
    /// Attached to the eventEmitter to listen for incoming ExtendableMessageEvents
    ///
    /// - Parameter message: The message we want to pass onto our onmessage handler
    fileprivate func handleMessage(_ message:ExtendableMessageEvent) {
        
        if self.onmessage == nil {
            return
        }
        
        onmessage!.call(withArguments: [message])
    }
    
    public func postMessage(_ data: Any) {
        self.postMessage(data, ports: [], fromWebView: nil)
    }
    
    public func postMessage(_ data:Any, ports:[MessagePort]) {
        self.postMessage(data, ports: ports, fromWebView: nil)
    }
    
    public func postMessage(_ data:Any, ports:[MessagePort], fromWebView:WKWebView?) {
        self.dispatchEvent(EmitMessageEvent(data: data, transfer: ports))
    }
    
    public func close() {
        if self._pendingJSExecution {
            self._pendingClose = true
        } else {
            self.dispatchEvent(CloseMessagePortEvent())
        }
    }
    
}
