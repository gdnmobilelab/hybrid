//
//  MessageChannel.swift
//  hybrid
//
//  Created by alastair.coote on 09/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import JavaScriptCore
import HybridShared


@objc public protocol MessageChannelExports : JSExport {
    var port1:MessagePort {get}
    var port2:MessagePort {get}
    init()
}


/// Implementation of MessageChannel: https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel
/// Basically just a pairing of two MessagePorts - postMessage-ing into one triggers a message event on the other.
@objc public class MessageChannel : NSObject, MessageChannelExports {
    public var port1 = MessagePort()
    public var port2 = MessagePort()
    
    fileprivate var listener1:Listener<EmitMessageEvent>?
    fileprivate var listener2:Listener<EmitMessageEvent>?
    
    
    fileprivate func emitTo(_ targetPort: MessagePort) -> (EmitMessageEvent) -> Void {
        return { (emit: EmitMessageEvent) in
            targetPort.dispatchEvent(ExtendableMessageEvent(data: emit.data, ports: emit.transfer, fromWebView: nil))
        }
    }
    
    override required public init() {
        super.init()
        
        self.listener1 = port1.addEventListener(self.emitTo(self.port2))
        self.listener2 = port2.addEventListener(self.emitTo(self.port1))
        
    }
}
