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
import Shared

class ConsoleMirrorTests: XCTestCase {
    
    
    override func tearDown() {
        Shared.Log.debug = { Log.debug?.message($0) }
        Shared.Log.info = { Log.info?.message($0) }
        Shared.Log.warn = { Log.warning?.message($0) }
        Shared.Log.error = { Log.error?.message($0) }
    }
    
    func testShouldMirrorAllLevels() {
        
        var functionsRun: Set<String> = []
        
        let testWorker = ServiceWorker(id: "TEST_WORKER", url: URL(string:"https://www.example.com/worker.js")!, registration: ServiceWorkerRegistrationPlaceholder(), content: "")
        
        XCTAssertNoThrow(testWorker.executionEnvironment)
        
        Shared.Log.info = { msg in
            XCTAssert(msg == "info-test")
            functionsRun.insert("info")
        }
        
        Shared.Log.debug = { msg in
            XCTAssert(msg == "debug-test")
            functionsRun.insert("debug")
        }
        
        Shared.Log.warn = { msg in
            XCTAssert(msg == "warn-test")
            functionsRun.insert("warn")
        }
        
        Shared.Log.error = { msg in
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
        
        Shared.Log.debug = { msg in
            XCTAssert(msg.contains("test = looks;"))
            XCTAssert(msg.contains("like = this;"))
        }
        
        let testWorker = ServiceWorker(id: "TEST_WORKER", url: URL(string:"https://www.example.com/worker.js")!, registration: ServiceWorkerRegistrationPlaceholder(), content: "")
        
        XCTAssertNoThrow(try testWorker.executionEnvironment.evaluateScript("console.debug({test:'looks', like: 'this'})"))
        
    }
    
    
}
