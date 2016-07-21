//
//  ServiceWorkerInstance.swift
//  hybrid
//
//  Created by alastair.coote on 08/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
@testable import hybrid


class ServiceWorkerInstanceSpec: QuickSpec {
    override func spec() {
        describe("Service Worker Instance") {
            it("should fire event listeners") {
                
                waitUntil { done in
                    
                    
                    let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!)

                    sw.loadServiceWorker(
                        "var currentValue = 1;" +
                        "self.addEventListener('test', function() {currentValue++;});"
                    ).then {_ in
                        return sw.runScript("var test = new ExtendableEvent('test'); self.dispatchEvent(test); currentValue")
                    }.then { (returnValue) -> Void in
                        
                        expect(returnValue.toInt32()).to(equal(2))
                        done()
                    }
                    .recover { (err:ErrorType) -> Void in
                        expect(err).to(beNil())
                        done()
                    }
                
                }
            }
            
            it("should connect native and JS promises") {
                
                waitUntil { done in
                    
                    let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!)

                    
                    sw.loadServiceWorker(
                        "var test = function() { return new Promise(function(fulfill) { fulfill('hello');});}"
                        ).then {_ in
                            return sw.executeJSPromise("test()")
                        }.then { (returnValue) -> Void in
                            
                            expect(returnValue.toString()).to(equal("hello"))
                            done()
                        }
                        .recover { (err:ErrorType) -> Void in
                            expect(err).to(beNil())
                            done()
                    }
                    
                }
            }
            
            it("should reject a JS promise that errors") {
                
                waitUntil { done in
                    
                    let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!)
 
                    sw.loadServiceWorker(
                        "var test = function() { return new Promise(function(fulfill, reject) { reject(new Error('hello'));});}"
                    ).then {_ in
                        return sw.executeJSPromise("test()")
                    }
                    .recover({ (err:ErrorType) -> JSValue in
                        
                        let jserror = err as! JSContextError

                        expect(jserror.message).to(equal("hello"))
                        done()
                        
                        // no idea why it's forcing me to do this
                        return JSValue()
                    })
                }
                    
            }
            
            it("should fire a extendable event") {
                waitUntil { done in
                    
                    let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!)
 
                    sw.loadServiceWorker(
                        "self.addEventListener('test', function(e) {" +
                        "   e.waitUntil(new Promise(function(fulfill) {" +
                        "       fulfill('hello');" +
                        "   }));" +
                        "})"
                    ).then {_ in
                        return sw.dispatchExtendableEvent("test", data: nil)
                    }
                    .then { (value) -> Void in
                        expect(value.toString()).to(equal("hello"))
                        done()
                        
                    }
                    .recover { (err:ErrorType) -> Void in
                        expect(err).to(beNil())
                        done()
                    }
                    
                }

            }
            
            it("should map a URL within scope") {
                let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!)
                
                do {
                    let mappedURL = try sw.getURLInsideServiceWorkerScope(NSURL(string:"file://test/file.html")!)
                    expect(mappedURL.host!).to(equal("localhost"))
                    expect(mappedURL.pathComponents![1]).to(equal("__service_worker"))
                    
                    let unescapedServiceWorkerURL = mappedURL.pathComponents![2].stringByRemovingPercentEncoding
                   
                    expect(unescapedServiceWorkerURL).to(equal("file://test/test.js"))
                    expect(mappedURL.pathComponents![3]).to(equal("test"))
                    expect(mappedURL.pathComponents![4]).to(equal("file.html"))
                }
                catch {
                    expect(error).to(beNil())
                }
                
            }
            

        }
        
        
    }
}