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
                    
                    let sw = ServiceWorkerInstance()

                    sw.loadServiceWorker(
                        "var currentValue = 1;" +
                        "self.addEventListener('test', function() {currentValue++;});"
                    ).then {_ in
                        return sw.runScript("self.emit('test'); currentValue")
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
                    
                    let sw = ServiceWorkerInstance()
                    
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
                    
                    let sw = ServiceWorkerInstance()
                    
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
            

        }
        
        
    }
}