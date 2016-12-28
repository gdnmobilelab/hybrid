//
//  WindowClient.swift
//  hybrid
//
//  Created by alastair.coote on 17/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol WindowClientExports : JSExport {
    var url:String {get}
    var id:String {get}
    
    @objc(postMessage::)
    func postMessage(_ message:AnyObject, ports: [MessagePort])
    
    func focus()
}

/// A partial implentation of the service worker WindowClient object: https://developer.mozilla.org/en-US/docs/Web/API/WindowClient
@objc class WindowClient : NSObject, WindowClientExports {
    var url:String
    var id:String
    
    init(url:String, uniqueId:String) {
        self.url = url
        self.id = uniqueId
    }
    
    @objc(postMessage::)
    /// Send a message to the webview, where it is picked up through navigator.serviceWorker.addEventListener('message')
    ///
    /// - Parameters:
    ///   - message: A serializable object - must consist of objects, arrays, numbers or strings.
    ///   - ports: MessagePorts to pass on to the webview. Are currently *not* passed, because we need to work out cross-process communication.
    func postMessage(_ message: AnyObject, ports: [MessagePort]) {
        
        let record = WebviewRecord(url: URL(string: self.url), index: Int(self.id)!, workerId: nil)
        
        // workerId maybe shouldn't be nil but we don't know it here because we're going to the webview
        // not from
        
        let newEvent = PendingWebviewAction(type: PendingWebviewActionType.postMessage, record: record, options: [
            "message": message
        ])
        
        WebviewClientManager.clientEvents.emit(newEvent)
        
    }
    
    
    /// Pass a focus event onto the webview, either immediately or when it next launches (if in notification content extension).
    /// This will pop the navigation controller to the specified view.
    func focus() {
        
        let record = WebviewRecord(url: URL(string: self.url), index: Int(self.id)!, workerId: nil)
        
        // workerId maybe shouldn't be nil but we don't know it here, and the focus event doesn't need it
        let newEvent = PendingWebviewAction(type: PendingWebviewActionType.focus, record: record)
        WebviewClientManager.clientEvents.emit(newEvent)
    }
}
