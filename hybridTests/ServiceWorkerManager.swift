//
//  ServiceWorkerManager.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore

@testable import hybrid


class ServiceWorkerManagerSpec: QuickSpec {
    
    
    override func spec() {
        
        
        describe("Service Worker Manager") {
            
            beforeEach {
                TestUtil.clearServiceWorkers()
            }
            
            
            it("should return nil with no service worker") {
                
                waitUntil { done in
                    ServiceWorkerManager.getServiceWorkerForURL(NSURL(string:"http://test.com/")!)
                    .then { (sw) -> Void in
                        expect(sw).to(beNil())
                        done()
                    }
                    .error { err in
                        expect(err).to(beNil())
                        done()
                    }
                }
               
            }
            
            it("should fetch SW URL when scope matches") {
                
                waitUntil { done in
                  
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string: "http://test.com/sw.js")!, scope: NSURL(string: "http://test.com")!, lastModified: 0, js: "".dataUsingEncoding(NSUTF8StringEncoding)!, installState: ServiceWorkerInstallState.Activated)
                    
                    .then { _ in
                        return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string:"http://test.com/test")!)
                        .then { (sw) -> Void in
                            expect(sw).toNot(beNil())
                            expect(sw!.url.absoluteString).to(equal("http://test.com/sw.js"))
                            done()
                        }
                    }
                    .error { err in
                        expect(err).to(beNil())
                        done()
                    }
                }
               
            }
            
            it("should install a service worker") {
                waitUntil { done in
                    
                    let js = "self.addEventListener('install', function() {})"
                    
                    
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970, js: js.dataUsingEncoding(NSUTF8StringEncoding)!)
                    .then { workerId in
                        return ServiceWorkerManager.installServiceWorker(workerId)
                        .then { (installState) -> Promise<ServiceWorkerInstance?> in
                            expect(installState).to(equal(ServiceWorkerInstallState.Installed))
                            return ServiceWorkerInstance.getById(workerId)
                        }
                    }
                    .then { (workerInstance) -> Void in
                        expect(workerInstance!.installState).to(equal(ServiceWorkerInstallState.Installed))
                        done()
                    }
                    .error { err in
                        expect(err).to(beNil())
                        done()
                    }
                }
            }
            
            it("should install a service worker") {
                waitUntil { done in
                    
                    let js = "self.addEventListener('install', function() {})"
                    
                    
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970, js: js.dataUsingEncoding(NSUTF8StringEncoding)!)
                        .then { workerId in
                            return ServiceWorkerManager.installServiceWorker(workerId)
                                .then { (installState) -> Promise<ServiceWorkerInstance?> in
                                    expect(installState).to(equal(ServiceWorkerInstallState.Installed))
                                    return ServiceWorkerInstance.getById(workerId)
                            }
                        }
                        .then { (workerInstance) -> Void in
                            expect(workerInstance!.installState).to(equal(ServiceWorkerInstallState.Installed))
                            done()
                        }
                        .error { err in
                            expect(err).to(beNil())
                            done()
                    }
                }
            }
            
            it("should activate a service worker when .skipWaiting() is used") {
                waitUntil { done in
                    
                    let js = "self.addEventListener('install', function() {" +
                             "    self.skipWaiting();" +
                             "})"
                    
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970, js: js.dataUsingEncoding(NSUTF8StringEncoding)!)
                        .then { workerId in
                            return ServiceWorkerManager.installServiceWorker(workerId)
                            .then {_ in 
                                return ServiceWorkerInstance.getById(workerId)
                            }
                        }
                        .then { (workerInstance) -> Void in
                            expect(workerInstance!.installState).to(equal(ServiceWorkerInstallState.Activated))
                            done()
                        }
                        .error { err in
                            expect(err).to(beNil())
                            done()
                    }
                }
            }
            
            it("should reuse existing, active service worker instances") {
                waitUntil { done in
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970, js: "".dataUsingEncoding(NSUTF8StringEncoding)!, installState: ServiceWorkerInstallState.Activated)
                    .then { (_) -> Void in
                        
                        return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://test.com/test1.html")!)
                        .then { (sw1) -> Void in
                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://test.com/test2.html")!)
                            .then { (sw2) -> Void in
                            
                                expect(sw1!).to(be(sw2!))
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
            
            it("should reuse existing worker when new version is installed but not activated") {
                waitUntil { done in
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970, js: "".dataUsingEncoding(NSUTF8StringEncoding)!, installState: ServiceWorkerInstallState.Activated)
                        .then { (_) -> Void in
                            
                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://test.com/test1.html")!)
                                .then { (sw1) -> Void in
                                    
                                    return ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970 + 1000, js: "".dataUsingEncoding(NSUTF8StringEncoding)!)
                            
                                    .then { newId in
                                        return ServiceWorkerManager.self.installServiceWorker(newId)
                                    }.then { _ in
                                        return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://test.com/test2.html")!)
                                            .then { (sw2) -> Void in
                                                expect(sw1!).to(be(sw2!))
                                                done()
                                        }

                                    }



                                    }
                                    
                                    
                            }
                        
                        .error { err in
                            expect(err).to(beNil())
                            done()
                    }
                    
                }

            }
            
            it("should return new service worker when activate is called") {
                waitUntil { done in
                    
                    let oldJS = "self.testValue = 1;"
                    
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970, js: oldJS.dataUsingEncoding(NSUTF8StringEncoding)!, installState: ServiceWorkerInstallState.Activated)
                        .then { (_) -> Void in
                            
                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://test.com/test1.html")!)
                                .then { (sw1:ServiceWorkerInstance?) -> Promise<Void> in
                                    
                                    expect(sw1!.executeJS("self.testValue").toInt32()).to(equal(1))
                                    
                                    let newJS = "self.testValue = 2; self.addEventListener('install', function() {self.skipWaiting();})"
                                    
                                    return ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970 + 1000, js: newJS.dataUsingEncoding(NSUTF8StringEncoding)!)
                                        
                                        .then { newId in
                                            return ServiceWorkerManager.installServiceWorker(newId)
                                        }
                                        
                                        .then { _ in
                                            return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: "http://test.com/test2.html")!)

                                        }
                                        .then { (sw2) -> Void in
                                            
                                            expect(sw2!.executeJS("self.testValue").toInt32()).to(equal(2))
                                            expect(sw1!).notTo(be(sw2!))
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
            
            it("should mark worker as redundant when activation fails") {
                waitUntil { done in
                    
                    let js = "self.addEventListener('activate', function() {" +
                        "    throw new Error('fail please');" +
                    "})"
                    
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"http://test.com/sw.js")!, scope: NSURL(string:"http://test.com")!, lastModified: NSDate().timeIntervalSince1970, js: js.dataUsingEncoding(NSUTF8StringEncoding)!)
                        .then { (workerId) -> Promise<ServiceWorkerInstance?> in
                            return ServiceWorkerManager.installServiceWorker(workerId)
                            .then { (installState) -> Promise<ServiceWorkerInstance?> in
                                expect(installState).to(equal(ServiceWorkerInstallState.Installed))
                                
                                return ServiceWorkerManager.getServiceWorkerForURL(NSURL(string:"http://test.com/test")!)
                            }
                            .then { swMaybe in
                                
                                // If the worker is invalid, it shouldn't be returned
                            
                                expect(swMaybe).to(beNil())
                                
                                // But we want to make sure it's been marked as redundant all the same
                                return ServiceWorkerInstance.getById(workerId)
                            }
                                    
                            
                        }
                        .then { (workerInstance) -> Void in
                            expect(workerInstance!.installState).to(equal(ServiceWorkerInstallState.Redundant))
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
