//
//  MessagePort.swift
//  hybrid
//
//  Created by alastair.coote on 09/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import JavaScriptCore
@testable import hybrid

@objc protocol CallbackRunnerProtocol : JSExport {
    func call(val: MessageEvent)
}

@objc class CallbackRunner : NSObject, CallbackRunnerProtocol {
    
    var callback: (MessageEvent) -> Void
    
    func call(val:MessageEvent) {
        self.callback(val)
    }
    
    init(callback: (MessageEvent) -> Void) {
        self.callback = callback
    }
}


class MessageChannelSpec: QuickSpec {
    override func spec() {
     
        describe("MessagePort") {
            it("should fire events") {
                
                waitUntil { done in
                    
                    let testContext = JSContext()
                    let callbackWrapper = CallbackRunner(callback: { val in
                        expect(val.data).to(equal("test message"))
                        done()
                    })
                    
                    testContext.exceptionHandler = { context, exception in
                        expect(exception).to(beNil())
                        done()
                    }
                    
                    
                    testContext.setObject(callbackWrapper, forKeyedSubscript: "callbackWrapper")
                    testContext.setObject(MessagePort.self, forKeyedSubscript: "MessagePort")
                    
                    testContext.evaluateScript("var msg = new MessagePort(); msg.onmessage = function(val) {callbackWrapper.call(val);};")
                    
                    let messagePort:MessagePort = testContext.objectForKeyedSubscript("msg").toObjectOfClass(MessagePort) as! MessagePort
                    messagePort.eventEmitter.emit("message", MessageEvent(data: "test message"))
                    
                }
                
            }
        }
        
        describe("MessageChannel") {
            it("should send messages across ports") {
                
                waitUntil { done in
                
                    let testContext = JSContext()
                    testContext.exceptionHandler = { context, exception in
                        expect(exception).to(beNil())
                        done()
                    }
                    
                    testContext.setObject(MessageChannel.self, forKeyedSubscript: "MessageChannel")
                    testContext.setObject(MessagePort.self, forKeyedSubscript: "MessagePort")
                    
                    let msgAsJSValue = testContext.evaluateScript("var msg = new MessageChannel(); msg;")
                        
                    let msg = msgAsJSValue.toObjectOfClass(MessageChannel) as! MessageChannel
                    
                    msg.port2.eventEmitter.once("message",{ (val:MessageEvent) in
                        expect(val.data).to(equal("test message 2"))
                        done()
                    })
                 
                    testContext.evaluateScript("msg.port1.postMessage('test message 2')")
                    
                }
            }
        }
    }
}
