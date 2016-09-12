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
                        let cache = ServiceWorkerCache(swURL: swURL, name: "test-cache")
                        return cache.addAll(["/text-file.txt"])
                        .then { _ in
                            
                            let fileToGet = NSURL(string: "http://localhost:9111/text-file.txt")!
                            
                            return cache.match(fileToGet)
                            .then { (response) -> Promise<Void> in
                                expect(response).notTo(beNil())
                                
                                expect(String(data: response.data!, encoding: NSUTF8StringEncoding)).to(equal("THIS IS TEXT"))

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
            
            xit("should not cache a non-200 response") {
                
                waitUntil(timeout: 500) { done in
                    
                    Promise<Void>()
                        .then { () -> Promise<Void> in
                            let swURL = NSURL(string: "http://localhost:9111/sw.js")!
                            let cache = ServiceWorkerCache(swURL: swURL, name: "test-cache")
                            return cache.addAll(["/text-file.txt","/text-file-that-does-not-exist.txt"])
                            .then { _ in
                                //should never get here
                                expect(1).to(equal(2))
                            }
                            .recover { (err) -> Promise<Void> in
                                
                                NSLog("Error? " + String(err))
                                
                                // Not only should it not save the 404, it should also abandon the entire cache
                                // attempt. Maybe. TODO: double check spec for this.
                                
                                let fileToGet = NSURL(string: "http://localhost:9111/text-file.txt")!
                                
                                return cache.match(fileToGet)
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
                
                waitUntil(timeout: 500) { done in
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string: "http://localhost/sw.js")!, scope: NSURL(string: "http://localhost/")!, lastModified: 1, js: NSData(contentsOfFile: filePath)!, installState: ServiceWorkerInstallState.Installed)
                        .then { _ in
                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://localhost/index.html")!)
                        }
                        .then { sw -> Promise<FetchResponse> in
                            
                            let cache = sw!.cache.open("test-cache")
                            
                            return cache.match(NSURL(string: "http://localhost:9111/text-file.txt")!)
                            
                        }
                        .then { response -> Void in
                            expect(response).toNot(beNil())
                            expect(String(data: response.data!, encoding: NSUTF8StringEncoding)).to(equal("THIS IS TEXT"))
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
                
                waitUntil { done in
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string: "http://localhost/sw.js")!, scope: NSURL(string: "http://localhost/")!, lastModified: 1, js: NSData(contentsOfFile: filePath)!, installState: ServiceWorkerInstallState.Installed)
                        .then { _ in
                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://localhost/index.html")!)
                        }
                        .then { sw -> Promise<FetchResponse?> in
                            
                            let fetch = FetchRequest(url: "http://localhost:9111/text-file.txt", options: nil)
                            fetch.method = "GET"
                            
                            return sw!.dispatchFetchEvent(fetch)
                        }
                        .then { response -> Void in
                            expect(response).notTo(beNil())
  
                            let responseBodyText = String(data: response!.data!, encoding: NSUTF8StringEncoding)
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
