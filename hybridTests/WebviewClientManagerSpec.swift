//
//  WebviewClientManagerSpec.swift
//  hybrid
//
//  Created by alastair.coote on 12/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
import GCDWebServer
@testable import hybrid


class WebviewClientManagerSpec: QuickSpec {
    override func spec() {
        describe("WebviewClientMananger") {
            
            var gcdWeb:GCDWebServer?
            
            beforeEach {
                
                gcdWeb = TestUtil.makeTestWebServer("test-workers", port: 9111)
                
                TestUtil.clearServiceWorkers()
                TestUtil.clearServiceWorkerCache()
                HybridWebview.clearRegisteredWebviews()
            }
            
            afterEach {
                gcdWeb!.stop()
            }

            
            beforeEach {
                ServiceWorkerManager.clearActiveServiceWorkers()
            }
            
            it("should return clients in matchAll()") {
                waitUntil(timeout: 5) { done in
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0, width: 10, height: 10))
                    
                    hw.registerWebviewForServiceWorkerEvents()
                    
                    let url = NSURLComponents(string: "http://localhost/test-register.html")!
                    url.port = gcdWeb!.port
                    
                    hw.eventManager!.events.once("ready-promise", { ev in
                        ServiceWorkerManager.getServiceWorkerForURL(url.URL!)
                        .then { sw in
                            return sw!.executeJSPromise("clients.matchAll()")
                        }.then { clientsJS -> Void in
                            let clientsArray = clientsJS.toArray() as! [WebviewClient]
                            
                            expect(clientsArray[0].url).to(equal(url.URL!.absoluteString!))

                            
                            done()
                        }.error {err in
                            expect(err).to(beNil())
                        }
                        
                    })
                    
                    hw.loadRequest(NSURLRequest(URL: url.URL!))
                }
            }
            
            it("should post messages") {
                waitUntil(timeout: 5) { done in
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0, width: 10, height: 10))
                    
                    hw.registerWebviewForServiceWorkerEvents()
                    
                    let url = NSURLComponents(string: "http://localhost/test-postmessage.html")!
                    url.port = gcdWeb!.port

                    hw.eventManager!.events.once("ready-promise", { ev in
                        ServiceWorkerManager.getServiceWorkerForURL(url.URL!)
                        .then { sw in
                            return sw!.executeJSPromise("testPostMessage()")
                        }
                        .then { jsResponse -> Void in
                            expect(jsResponse.toString()).to(equal("\"received\""))
                            done()
                        }
                        .error { err in
                            expect(err).to(beNil())
                        }
                    })
                    
                    hw.loadRequest(NSURLRequest(URL: url.URL!))
                }
            }
        }
    }
}
