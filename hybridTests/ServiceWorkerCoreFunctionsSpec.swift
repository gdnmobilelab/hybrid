//
//  ServiceWorkerCoreFunctionsSpec.swift
//  hybrid
//
//  Created by alastair.coote on 17/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
@testable import hybrid


class ServiceWorkerCoreFunctionSpec: QuickSpec {
    override func spec() {
        describe("Service Worker Core Functions") {
            
            beforeEach {
                ServiceWorkerManager.clearActiveServiceWorkers()
            }
            
            it("should construct Request correctly") {
                let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!, instanceId:0, installState: ServiceWorkerInstallState.Installed)
                waitUntil { done in
                    sw.loadServiceWorker("")
                    .then { _ -> Void in
                        
                        let reqAsJS = sw.executeJS("var test = new Request('http://localhost/test.html',{method:'POST', headers: {'Content-Type':'text/html'}}); test")
                        NSLog("req is " + reqAsJS.toString())
                        let req = reqAsJS.toObjectOfClass(FetchRequest) as! FetchRequest
                        expect(req.method).to(equal("POST"))
                        expect(req.url).to(equal("http://localhost/test.html"))
                        expect(req.headers.get("content-type")).to(equal("text/html"))
                        done()
                    }
                }
                
            }
            
            it("should be able to bridge promises") {
                let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!, instanceId:0, installState: ServiceWorkerInstallState.Installed)
                
                waitUntil(timeout: 500) { done in
                    sw.loadServiceWorker("var test = Promise.resolve(123); var test2 = new Promise(function(fulfill, reject) {reject(new Error('no'))})")
                    .then { _ in
                        
                        return PromiseBridge<NSNumber>(jsPromise: sw.jsContext.objectForKeyedSubscript("test"))
                        .then { result -> Void in
                            expect(result).to(equal(123))
                            
                            PromiseBridge<NSNumber>(jsPromise: sw.jsContext.objectForKeyedSubscript("test2"))
                            .then { _ -> Void in
                                // we should never get here
                                expect(1).to(equal(2))
                                done()
                            }
                            .recover { err in
                                done()
                            }
                            
                            
                        }
                        .error { err in
                            expect(err).to(beNil())
                            done()
                        }
                    }
                    
                }
            }
            
            it("should promisify functions") {
                
                // Our JS library wraps the native functions in promised versions. Let's check that works.
                
                let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!, instanceId:0, installState: ServiceWorkerInstallState.Installed)
                
                waitUntil(timeout:500) { done in
                    sw.loadServiceWorker("")
                    .then { _ -> Promise<Void> in
                            
                        sw.executeJS("var test = new Response('{\"hello\": \"is it me?\"}');")
                    
                        return sw.executeJSPromise("test.json()")
                        .then { val -> Void in
                            expect(val.toObject()["hello"]).to(equal("is it me?"))
                            done()
                        }
                        
                    }
                    .error { err in
                        expect(err).to(beNil())
                        done()
                    }
                }
            }
            
            it("should fetch") {
                waitUntil { done in
                    let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!, instanceId:0, installState: ServiceWorkerInstallState.Installed)
                    
                    let gcdWeb = TestUtil.makeTestWebServer("fetch-test")
           
                    
                    let urlToGrab = NSURLComponents(string: "http://localhost/file.txt")!
                    urlToGrab.port = gcdWeb.port
                    sw.loadServiceWorker("")
                    .then { _ in
                        return sw.executeJSPromise("fetch('" + urlToGrab.URL!.absoluteString + "').then(function(res){ return res.text()})")
                    }
                    
                    .then { response -> Void in
                        expect(response.toString()).to(equal("HELLO"))
                        done()
                        
                    }.always { _ -> Void in
                        gcdWeb.stop()
                    }
                    .error { err in
                        expect(err).to(beNil())
                        
                    }

                }
            }
        }
    
    }
}