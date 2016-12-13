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
        self.listener1 = port1.eventEmitter.on("emit", { (msg: ExtendableMessageEvent?) in
            self.port2.eventEmitter.emit("message", msg!)
        })
        
        self.listener2 = port2.eventEmitter.on("emit", { (msg: ExtendableMessageEvent?) in
            self.port1.eventEmitter.emit("message", msg!)
        })
        
    }
}
