//
//  JSPromise.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 23/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import ServiceWorker
import Shared

class JSPromiseTests: XCTestCase {
    
    func testFulfillPromise() {
        
        let context = JSContext()!
        let promise = JSPromise(context: context)
        
        context.setObject(promise.jsValue, forSubscriptString: "testPromise")
        
        context.evaluateScript("""
            var testValue = 0;
            testPromise.then(function(newValue) {
                testValue = newValue;
            })
        """)
        
        XCTAssert(context.objectForKeyedSubscript("testValue").toInt32() == 0)
        promise.fulfill(10)
        XCTAssert(context.objectForKeyedSubscript("testValue").toInt32() == 10)
        
    }
    
    func testRejectPromise() {
        
        let context = JSContext()!
        let promise = JSPromise(context: context)
        
        context.setObject(promise.jsValue, forSubscriptString: "testPromise")
        
        context.evaluateScript("""
            var testValue = 0;
            testPromise.catch(function(errorValue) {
                testValue = errorValue.message;
            })
        """)
        
        XCTAssert(context.objectForKeyedSubscript("testValue").toInt32() == 0)
        promise.reject(ErrorMessage("oh no"))
        let rejectValue = context
            .objectForKeyedSubscript("testValue")
            .toString()
        XCTAssert(rejectValue == "oh no")
        
    }
    
    
    
}
