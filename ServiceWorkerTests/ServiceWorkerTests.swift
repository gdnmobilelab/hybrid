//
//  ServiceWorkerTests.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import CleanroomLogger
import JavaScriptCore

class ServiceWorkerTests: XCTestCase {
    
    
    func testLoadContentFunction() {
        
        let sw = ServiceWorker(id: "TEST", url: URL(string: "http://www.example.com/test.js")!, registration: DummyServiceWorkerRegistration(), loadContent: { (worker) -> String in
            return "var testValue = 'hello';"
        })
        
        var jsVal:JSValue? = nil
        XCTAssertNoThrow(jsVal = try sw.executionEnvironment.evaluateScript("testValue"))
        
        XCTAssertEqual(jsVal!.toString(), "hello")

    }
    
    func testLoadContentDirectly() {
        
        let sw = ServiceWorker(id: "TEST", url: URL(string: "http://www.example.com/test.js")!, registration: DummyServiceWorkerRegistration(), content: "var testValue = 'hello';")
        
        var jsVal:JSValue? = nil
        XCTAssertNoThrow(jsVal = try sw.executionEnvironment.evaluateScript("testValue"))
        
        XCTAssertEqual(jsVal!.toString(), "hello")
        
    }
    
    
}
