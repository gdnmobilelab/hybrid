//
//  ConsoleTests.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import CleanroomLogger

class ConsoleMirrorTests: XCTestCase {
    
    
    override func tearDown() {
        ServiceWorker.logInterface.debug = { Log.debug?.message($0) }
        ServiceWorker.logInterface.info = { Log.info?.message($0) }
        ServiceWorker.logInterface.warn = { Log.warning?.message($0) }
        ServiceWorker.logInterface.error = { Log.error?.message($0) }
    }
    
    func testShouldMirrorAllLevels() {
        
        var functionsRun: Set<String> = []
        
        let testWorker = ServiceWorker(id: "TEST_WORKER", url: URL(string:"https://www.example.com/worker.js")!, registration: ServiceWorkerRegistrationPlaceholder())
        
        XCTAssertNoThrow(testWorker.executionEnvironment)
        
        ServiceWorker.logInterface.info = { msg in
            XCTAssert(msg == "info-test")
            functionsRun.insert("info")
        }
        
        ServiceWorker.logInterface.debug = { msg in
            XCTAssert(msg == "debug-test")
            functionsRun.insert("debug")
        }
        
        ServiceWorker.logInterface.warn = { msg in
            XCTAssert(msg == "warn-test")
            functionsRun.insert("warn")
        }
        
        ServiceWorker.logInterface.error = { msg in
            XCTAssert(msg == "error-test")
            functionsRun.insert("error")
        }
        
        AssertNoErrorMessage {
            _ = try testWorker.executionEnvironment.evaluateScript("""
                console.info('info-test');
                console.debug('debug-test');
                console.warn('warn-test');
                console.error('error-test');
            """)
        }
        
        XCTAssert(functionsRun.contains("info"))
        XCTAssert(functionsRun.contains("debug"))
        XCTAssert(functionsRun.contains("warn"))
        XCTAssert(functionsRun.contains("error"))
    }
    
    func testShouldMirrorObjects() {
        
        ServiceWorker.logInterface.debug = { msg in
            XCTAssert(msg.contains("test = looks;"))
            XCTAssert(msg.contains("like = this;"))
        }
        
        let testWorker = ServiceWorker(id: "TEST_WORKER", url: URL(string:"https://www.example.com/worker.js")!, registration: ServiceWorkerRegistrationPlaceholder())
        
        XCTAssertNoThrow(try testWorker.executionEnvironment.evaluateScript("console.debug({test:'looks', like: 'this'})"))
        
    }
    
    
}
