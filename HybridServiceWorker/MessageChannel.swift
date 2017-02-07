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


@objc protocol MessageChannelExports : JSExport {
    var port1:MessagePort {get}
    var port2:MessagePort {get}
    init()
}


/// Implementation of MessageChannel: https://developer.mozilla.org/en-US/docs/Web/API/MessageChannel
/// Basically just a pairing of two MessagePorts - postMessage-ing into one triggers a message event on the other.
@objc class MessageChannel : NSObject, MessageChannelExports {
    var port1 = MessagePort()
    var port2 = MessagePort()
    
    fileprivate var listener1:Listener<ExtendableMessageEvent?>?
    fileprivate var listener2:Listener<ExtendableMessageEvent?>?
    
    override required init() {
        super.init()
        self.listener1 = port1.events.on("emit", { (msg: ExtendableMessageEvent?) in
            self.port2.events.emit("message", msg!)
        })
        
        self.listener2 = port2.events.on("emit", { (msg: ExtendableMessageEvent?) in
            self.port1.events.emit("message", msg!)
        })
        
    }
}
