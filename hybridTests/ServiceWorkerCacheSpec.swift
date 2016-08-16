//
//  ServiceWorkerCacheSpec.swift
//  hybrid
//
//  Created by alastair.coote on 28/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
import GCDWebServer

@testable import hybrid


class ServiceWorkerCacheSpec: QuickSpec {
    
    override func spec() {
        
        describe("Service Worker Cache") {
        
            var gcdWeb:GCDWebServer?
            
            beforeEach {
                
                gcdWeb = TestUtil.makeTestWebServer("cache-test-data", port: 9111)
                
                TestUtil.clearServiceWorkers()
                TestUtil.clearServiceWorkerCache()
            }
            
            afterEach {
                gcdWeb!.stop()
            }
            
            it("should store a cache entry and return both match and response") {
                
                waitUntil { done in
                    
                    Promise<Void>()
                    .then { () -> Promise<Void> in
                        let swURL = NSURL(string: "http://localhost:9111/sw.js")!
                        let cache = ServiceWorkerCache(swURL: swURL)
                        return cache.addAll(["/text-file.txt"], cacheName: "test-cache")
                        .then { _ in
                            
                            let fileToGet = NSURL(string: "http://localhost:9111/text-file.txt")!
                            
                            return cache.match(fileToGet, cacheName: "test-cache")
                            .then { (response) -> Promise<Void> in
                                expect(response).notTo(beNil())
                                
                                // Now let's get the actual response to check
                                
                                let responseObject = try ServiceWorkerCache.getResponse(fileToGet.absoluteString, serviceWorkerURL: swURL.absoluteString, cacheName: "test-cache")
                                
                                expect(String(data: responseObject!.response, encoding: NSUTF8StringEncoding)).to(equal("THIS IS TEXT"))

                                return Promise<Void>()
                            }
                            
                        }

                    }
                    .then {
                        done()
                    }
                    .error { err in
                        expect(err).to(beNil())
                        done()
                    }
                    
                  
                    
                    
                }
            }
            
            it("should not cache a non-200 response") {
                
                waitUntil(timeout: 500) { done in
                    
                    Promise<Void>()
                        .then { () -> Promise<Void> in
                            let swURL = NSURL(string: "http://localhost:9111/sw.js")!
                            let cache = ServiceWorkerCache(swURL: swURL)
                            return cache.addAll(["/text-file.txt","/text-file-that-does-not-exist.txt"], cacheName: "test-cache")
                            .then { _ in
                                //should never get here
                                expect(1).to(equal(2))
                            }
                            .recover { (err) -> Promise<Void> in
                                
                                NSLog("Error? " + String(err))
                                
                                // Not only should it not save the 404, it should also abandon the entire cache
                                // attempt. Maybe. TODO: double check spec for this.
                                
                                let fileToGet = NSURL(string: "http://localhost:9111/text-file.txt")!
                                
                                return cache.match(fileToGet, cacheName: "test-cache")
                                    .then { (response) -> Void in
                                        expect(response).to(beNil())
                                        done()
                                }
                                    
                            }
                            
                        }

                        .error { err in
                            expect(err).to(beNil())
                            done()
                    }
                    
                    
                    
                    
                }
            }
            
            
            
            it("should bridge inside a worker successfully") {
                
                let filePath = TestUtil.getFilePath("test-workers/test-cache-in-worker.js")
                
                waitUntil { done in
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string: "https://test.local/sw.js")!, scope: NSURL(string: "https://test.local/")!, lastModified: 1, js: NSData(contentsOfFile: filePath)!, installState: ServiceWorkerInstallState.Installed)
                        .then { _ in
                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "https://test.local/index.html")!)
                        }
                        .then { sw -> Void in
                            let response = try ServiceWorkerCache.getResponse("http://localhost:9111/text-file.txt", serviceWorkerURL: "https://test.local/sw.js", cacheName: "test-cache")
                            expect(response).toNot(beNil())
                            expect(String(data: response!.response, encoding: NSUTF8StringEncoding)).to(equal("THIS IS TEXT"))
                            done()
                        }
                        .error { err in
                            expect(err).to(beNil())
                            done()
                    }
                }
                
                
            }
            
            it("should successfully return from a fetch event") {
               
                let filePath = TestUtil.getFilePath("test-workers/test-cache-in-worker.js")
                
                waitUntil(timeout: 500) { done in
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string: "https://test.local/sw.js")!, scope: NSURL(string: "https://test.local/")!, lastModified: 1, js: NSData(contentsOfFile: filePath)!, installState: ServiceWorkerInstallState.Installed)
                        .then { _ in
                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "https://test.local/index.html")!)
                        }
                        .then { sw -> Promise<FetchResponse> in
                            
                            let fetch = FetchRequest()
                            fetch.method = "GET"
                            fetch.url = NSURL(string: "http://localhost:9111/text-file.txt")!
                            
                            return sw!.dispatchFetchEvent(fetch)
                        }
                        .then { response -> Void in
                            expect(response).notTo(beNil())
                            
                            // response body is not sent into JSContext - we need to grab it manually
                            try response.checkForCacheMatchResponse()
                            
                            let responseBodyText = try String(data: response.getBody(), encoding: NSUTF8StringEncoding)
                            expect(responseBodyText).to(equal("THIS IS TEXT"))
                            done()
                        }
                        .error { err in
                            expect(err).to(beNil())
                            done()
                        }
                }
            }
        }
    }
}