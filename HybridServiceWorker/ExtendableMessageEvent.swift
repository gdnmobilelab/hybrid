//
//  ExtendableMessageEvent.swift
//  hybrid
//
//  Created by alastair.coote on 13/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import JavaScriptCore
import HybridShared

@objc protocol ExtendableMessageEventExports : ExtendableEventExports, JSEvent, JSExport {
    var data:Any? {get}
    var ports:[MessagePort] {get}
    //    init(data:AnyObject?, ports:[MessagePort]?)
}


/// Implementation of browser ExtendableMessageEvent: https://developer.mozilla.org/en-US/docs/Web/API/ExtendableMessageEvent
@objc public class ExtendableMessageEvent : ExtendableEvent, ExtendableMessageEventExports {
    
    public static let type = "message"
    
    public var data:Any?
    var ports:[MessagePort]
    
    /// We use this to make sure we aren't echoing messages back to the
    /// webview that sent them. Need to look at the logic of this because
    /// it doesn't make a lot of sense that it would ever do that
    var fromWebView:WKWebView?
    
    public required init(data:Any?, ports: [MessagePort]?) {
        
        self.data = data
        
        if ports != nil {
            self.ports = ports!
        } else {
            self.ports = [MessagePort]()
        }
        
        self.fromWebView = nil
        super.init()
        
    }
    
    
    init(data:Any?, ports:[MessagePort], fromWebView:WKWebView?) {
        self.data = data
        self.ports = ports
        
        self.fromWebView = fromWebView
        super.init()
    }
    
    required public init(type: String) {
        fatalError("ExtendableMessageEvent must be created with data, ports initializer")
    }
}
