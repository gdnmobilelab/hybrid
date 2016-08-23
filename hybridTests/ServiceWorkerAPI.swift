//
//  ServiceWorkerAPI.swift
//  hybrid
//
//  Created by alastair.coote on 12/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
import XCGLogger
import GCDWebServer
@testable import hybrid

class ServiceWorkerAPISpec: QuickSpec {
    override func spec() {
        
        var webServer:GCDWebServer?
        
        beforeEach {
            TestUtil.clearServiceWorkers()
            HybridWebview.clearRegisteredWebviews()
            NSURLCache.sharedURLCache().removeAllCachedResponses()
            
            webServer = TestUtil.makeTestWebServer("test-workers")
        }
        
        afterEach {
            webServer!.stop()
        }
        
        describe("Service Worker API") {
            it("Should register a worker") {
                
                waitUntil { done in
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0, width: 10, height: 10))
                   
                    HybridWebview.registerWebviewForServiceWorkerEvents(hw)
                    
                    var ranInstalling = false
                    var ranInstalled = false
                    var ranActivating = false
                    var firedReadyEvent = false;
                    
                    hw.eventManager!.events.once("first/installing", { ev in
                        ranInstalling = true
                    })
                    
                    hw.eventManager!.events.once("first/installed", { ev in
                        ranInstalled = true
                        
                    })
                    
                    hw.eventManager!.events.once("ready-promise", { ev in
                        firedReadyEvent = true
                    })
                    
                    hw.eventManager!.events.once("first/activating", { ev in
                        ranActivating = true
                    })
                    
                    hw.eventManager!.events.once("first/activated", { ev in
                        expect(ranInstalling).to(equal(true))
                        expect(ranInstalled).to(equal(true))
                        expect(ranActivating).to(equal(true))
                        expect(firedReadyEvent).to(equal(true))
                        done()
                    })
                    
                    let url = NSURLComponents(string: "http://localhost/test-register.html")!
                    url.port = webServer?.port
                    
                    hw.loadRequest(NSURLRequest(URL: url.URL!))
                }

            }
            
            it("Should bridge messages with a worker") {
                waitUntil(timeout:500) { done in
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0, width: 10, height: 10))
                    HybridWebview.registerWebviewForServiceWorkerEvents(hw)
                    hw.eventManager!.events.once("reply", { evt in
                        expect(evt).to(equal("2"))
                        done()
                    })
                    
                    let url = NSURLComponents(string: "http://localhost/test-postmessage.html")!
                    url.port = webServer?.port
                    
                    hw.loadRequest(NSURLRequest(URL: url.URL!))
                }
            }
            
            it("Should update a worker") {
                
                waitUntil{ done in
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0, width: 10, height: 10))
                    
                    hw.eventManager!.events.once("first/activated", { _ in
                        
                        // hacky! switch web servers so when it runs update it gets
                        // new content
                        
                        let currentPort = webServer!.port
                        webServer!.stop()
                        
                        webServer = TestUtil.makeTestWebServer("update-worker-test", port: Int(currentPort))
                        NSURLCache.sharedURLCache().removeAllCachedResponses()
                        hw.evaluateJavaScript("window.updateReg()", completionHandler: { (res:AnyObject?, err: NSError?) in
                            expect(err).to(beNil())
                        })
                    })
                    
                    hw.eventManager!.events.once("second/installed", {_ in
                        // restore server
                        done()
                    })
                    
                    let url = NSURLComponents(string: "http://localhost/test-register.html")!
                    url.port = webServer?.port
                    
                    hw.loadRequest(NSURLRequest(URL: url.URL!))
                }
                
            }
            
            it("Should activate a new worker that calls skipWaiting() and clients.claim()") {
                
                waitUntil { done in
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0, width: 10, height: 10))
                    
                    HybridWebview.registerWebviewForServiceWorkerEvents(hw)
                    
    
                    var controllerChanged = false;
                    hw.eventManager!.events.once("controllerchange", { ev in
                        controllerChanged = true
                        
                    })
                    
          
                    hw.eventManager!.events.once("second/activated", { ev in
                        
                        hw.eventManager!.events.once("reply", { ev in
                            expect(ev).to(equal("2"))
                            done()
                        })
                        
                        expect(controllerChanged).to(equal(true))
                        hw.evaluateJavaScript("window.testMessage()", completionHandler: { (res:AnyObject?, err: NSError?) in
                            expect(err).to(beNil())
                        })
                    })
                    
                    hw.eventManager!.events.once("reply", { ev in
                        expect(ev).to(equal("1"))
                        // hacky! switch web servers so when it runs update it gets
                        // new content
                        
                        let currentPort = webServer!.port
                        webServer!.stop()
                        
                        webServer = TestUtil.makeTestWebServer("update-worker-skip-waiting", port: Int(currentPort))
                        NSURLCache.sharedURLCache().removeAllCachedResponses()
                        hw.evaluateJavaScript("window.updateReg()", completionHandler: { (res:AnyObject?, err: NSError?) in
                            expect(err).to(beNil())
                        })

                    
                    })
                
                    hw.eventManager!.events.once("first/activated", { _ in
                        hw.evaluateJavaScript("window.testMessage()", completionHandler: { (res:AnyObject?, err: NSError?) in
                            expect(err).to(beNil())
                        })
                    })
                    
                    hw.eventManager!.events.once("first/redundant", {_ in
                        
                    })
                    
                    let url = NSURLComponents(string: "http://localhost/test-register.html")!
                    url.port = webServer?.port
                    
                    hw.loadRequest(NSURLRequest(URL: url.URL!))
                }
                
            }

        }
    }
}
