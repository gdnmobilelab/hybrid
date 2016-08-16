//
//  MessageChannelManager.swift
//  hybrid
//
//  Created by alastair.coote on 10/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
import XCGLogger
@testable import hybrid

class MessageChannelManagerSpec: QuickSpec {
    override func spec() {
        describe("Message Channel Manager") {
            it("should receive messages from a webview") {
                
                waitUntil { done in
                    
                    let msgChannel = MessageChannel()
                    
                    msgChannel.port1.eventEmitter.once("message", { (msg: MessageEvent) in
                        expect(msg.data).to(equal("\"test message\""))
                        done()
                    })
                    
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0,width: 10,height: 10))
                    
                    let channelIndex = hw.messageChannelManager!.manuallyAddPort(msgChannel.port2)
                    hw.loadHTMLString("<html><body><script>var port = hybridPortStore.findOrCreateByNativeIndex(" + String(channelIndex) + ").jsMessagePort;port.postMessage('test message');</script></body></html>", baseURL: nil)
                }
                
            }
            
            
            it("should send across channels") {
                waitUntil { done in
                    
                    // Confusing test, but we want to make sure we can pass channels as arguments in postMessage calls.
                    
                    let msgChannel = MessageChannel()
                    
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0,width: 10,height: 10))
                    
                    msgChannel.port1.eventEmitter.once("message", { (msg:MessageEvent) in
                        expect(msg.data).to(equal("\"sending to\""))
                        
                        let secondChannel = MessageChannel()
                        secondChannel.port1.eventEmitter.once("message", { msg in
                            expect(msg.data).to(equal("\"back once again\""))
                            done()
                        })
                        
                        msg.ports[0].postMessage("and back", ports: [secondChannel.port2])
                    })
                    
                    let channelIndex = hw.messageChannelManager!.manuallyAddPort(msgChannel.port2)
                    
                    let js = "var port = hybridPortStore.findOrCreateByNativeIndex(" + String(channelIndex) + ").jsMessagePort;" +
                        "var channel = new MessageChannel();" +
                        "channel.port2.onmessage = function(event) {" +
                        "   event.ports[0].postMessage('back once again');" +
                        "};" +
                        "port.postMessage('sending to',[channel.port1]);"
                   
                    hw.loadHTMLString(
                        "<html><body><script>" +
                        js +
                        "</script></body></html>", baseURL: nil)
                }
            }
            
//            it("should communicate between a service worker and webview") {
//                TestUtil.makeTestWebServer("server-test-data")
//            }

            
            
        }
    }
}