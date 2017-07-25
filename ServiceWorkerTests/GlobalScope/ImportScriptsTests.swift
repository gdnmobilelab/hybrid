//
//  ImportScriptsTests.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 24/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import JavaScriptCore

class ImportScriptsTests: XCTestCase {
    
    func testImportingAScript() {

        let sw = ServiceWorker(id: "TEST", url: URL(string: "http://www.example.com/worker.js")!, registration: DummyServiceWorkerRegistration(), content: "")
        
        sw.importScripts = { worker, scripts in
            XCTAssertEqual(scripts[0].absoluteString, "http://www.example.com/test.js")
            return ["testValue = 'hello';"]
        }
        
        var returnVal:JSValue? = nil
        
        XCTAssertNoThrow(returnVal = try sw.executionEnvironment.evaluateScript("importScripts('test.js'); testValue;"))
        
        XCTAssertEqual(returnVal!.toString(), "hello")
    }
    
    func testImportingMultipleScripts() {
        
        let sw = ServiceWorker(id: "TEST", url: URL(string: "http://www.example.com/worker.js")!, registration: DummyServiceWorkerRegistration(), content: "")
        
        sw.importScripts = { worker, scripts in
            XCTAssertEqual(scripts[0].absoluteString, "http://www.example.com/test.js")
            XCTAssertEqual(scripts[1].absoluteString, "http://www.example.com/test2.js")
            return ["testValue = 'hello';", "testValue = 'hello2';"]
        }
        
        var returnVal:JSValue? = nil
        
        XCTAssertNoThrow(returnVal = try sw.executionEnvironment.evaluateScript("importScripts(['test.js', 'test2.js']); testValue;"))
        
        XCTAssertEqual(returnVal!.toString(), "hello2")
    }
    
    func testImportingWithBlockingSyncOperation() {
        
        let sw = ServiceWorker(id: "TEST", url: URL(string: "http://www.example.com/worker.js")!, registration: DummyServiceWorkerRegistration(), content: "")
        
        sw.importScripts = { worker, scripts in
            XCTAssertEqual(scripts[0].absoluteString, "http://www.example.com/test.js")
            
            let semaphore = DispatchSemaphore(value: 0)
            
            DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + .seconds(1)) {
                semaphore.signal()
            }
            
            _ = semaphore.wait(timeout: .distantFuture)
            
            return ["testValue = 'hello';"]
        }
        
        var returnVal:JSValue? = nil
        
        XCTAssertNoThrow(returnVal = try sw.executionEnvironment.evaluateScript("importScripts('test.js'); testValue;"))
        
        XCTAssertEqual(returnVal!.toString(), "hello")
    }
    
}
