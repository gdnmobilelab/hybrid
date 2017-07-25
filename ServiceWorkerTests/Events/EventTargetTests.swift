//
//  EventTargetTests.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import JavaScriptCore

class EventTargetTests: XCTestCase {
    
    func testShouldFireEvents() {
        
        let testEvents = EventTarget()
        
        let sw = ServiceWorker(id: "TEST", url: URL(string: "https://www.example.com")!, registration: ServiceWorkerRegistrationPlaceholder(), content: "").executionEnvironment
        
        sw.jsContext.setObject(testEvents,forSubscriptString: "testEvents")
        
        AssertNoErrorMessage {
            _ = try sw.evaluateScript("""
            var didFire = false;
            testEvents.addEventListener('test', function() {
                didFire = true;
            });
            testEvents.dispatchEvent(new Event('test'));
        """)
        }
        
        XCTAssert(sw.jsContext.objectForKeyedSubscript("didFire").toBool() == true)
        
    }
    
    func testShouldRemoveEventListeners() {
        
        let testEvents = EventTarget()
        
        let sw = ServiceWorker(id: "TEST", url: URL(string: "https://www.example.com")!, registration: ServiceWorkerRegistrationPlaceholder(), content: "").executionEnvironment
        
        sw.jsContext.setObject(testEvents,forSubscriptString: "testEvents")
        
        AssertNoErrorMessage {
            _ = try sw.evaluateScript("""
            var didFire = false;
            function trigger() {
                didFire = true;
            }
            testEvents.addEventListener('test', trigger);
            testEvents.removeEventListener('test', trigger);
            testEvents.dispatchEvent(new Event('test'));
        """)
        }
        
        XCTAssert(sw.jsContext.objectForKeyedSubscript("didFire").toBool() == false)
        
    }
    
    
    
}
