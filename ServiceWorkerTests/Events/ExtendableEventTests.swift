//
//  ExtendableEventTests.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 25/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import ServiceWorker

class ExtendableEventTests: XCTestCase {
    
    
    func testExtendingAnEvent() {
        
        let context = JSContext()!
        let ev = ExtendableEvent(type: "test")
        
        context.globalObject.setValue(ev, forProperty: "testEvent")
        
        context.evaluateScript("""
            var testResult = false
            testEvent.waitUntil(new Promise(function(fulfill,reject) {
                testResult = true
                fulfill()
            }))
        """)
        let expect = expectation(description: "Promise resolves")
        
        ev.resolve { err in
            XCTAssertEqual(context.objectForKeyedSubscript("testResult").toBool(), true)
            expect.fulfill()
        }

        wait(for: [expect], timeout: 1)
        
    }
    
    func testPromiseRejection() {
        
        let context = JSContext()!
        let ev = ExtendableEvent(type: "test")
        
        context.globalObject.setValue(ev, forProperty: "testEvent")
        
        context.evaluateScript("""
            testEvent.waitUntil(new Promise(function(fulfill,reject) {
                reject(new Error("failure"))
            }))
        """)
        let expect = expectation(description: "Promise resolves")
        
        ev.resolve { err in
            XCTAssertEqual(String(describing: err!), "failure")
            expect.fulfill()
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testExtendingWithMultiplePromises() {

        let context = JSContext()!
        let ev = ExtendableEvent(type: "test")

        context.globalObject.setValue(ev, forProperty: "testEvent")

        context.evaluateScript("""
            var executionCount = 0
            testEvent.waitUntil(new Promise(function(fulfill,reject) {
                executionCount++
                fulfill()
            }))
            testEvent.waitUntil(new Promise(function(fulfill,reject) {
                executionCount++
                fulfill()
            }))
        """)
        let expect = expectation(description: "Promise resolves")

        ev.resolve { err in
            XCTAssertEqual(context.objectForKeyedSubscript("executionCount").toInt32(), 2)
            expect.fulfill()
        }

        wait(for: [expect], timeout: 1)

    }
    
}
