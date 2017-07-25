//
//  ServiceWorkerRegistrationTests.swift
//  ServiceWorkerContainerTests
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
import HybridShared
@testable import ServiceWorker
import Shared
import GCDWebServers
import JavaScriptCore
@testable import ServiceWorkerContainer

class ServiceWorkerRegistrationTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        do {
            if FileManager.default.fileExists(atPath: CoreDatabase.dbPath.path) {
                try FileManager.default.removeItem(at: CoreDatabase.dbPath)
                CoreDatabase.dbMigrationCheckDone = false
            }
        } catch {
            XCTFail(String(describing: error))
        }
        TestWeb.createServer()
        URLCache.shared.removeAllCachedResponses()
    }
    
    override func tearDown() {
        TestWeb.destroyServer()
    }
    
    func testCreateBlankRegistration() {
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: URL(string:"https://www.example.com")!) }
        XCTAssertEqual(reg!.scope.absoluteString, "https://www.example.com")
        
        // An attempt to create a registration when one already exists should fail
        XCTAssertThrowsError(try ServiceWorkerRegistration.create(scope: URL(string:"https://www.example.com")!))
        
    }
    
    func testFailRegistrationOutOfScope() {
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: URL(string:"https://www.example.com/one")!) }
        XCTAssertEqual(reg!.scope.absoluteString, "https://www.example.com/one")
        
        reg!.register(URL(string: "https://www.example.com/two/test.js")!) { err, result in
            XCTAssertNotNil(err)
        }
        
    }
    
    func testShouldPopulateWorkerFields() {

        AssertNoErrorMessage {

            try CoreDatabase.inConnection() { connection in

                try ["active", "installing", "waiting","redundant"].forEach { state in

                    let dummyWorkerValues: [Any] = [
                        "TEST_ID_" + state,
                        "https://www.example.com/worker.js",
                        "DUMMY_HEADERS",
                        "DUMMY_CONTENT",
                        ServiceWorkerInstallState.activated.rawValue,
                        "https://www.example.com"
                    ]

                    _ = try connection.insert(sql: "INSERT INTO workers (worker_id, url, headers, content, install_state, scope) VALUES (?,?,?,?,?,?)", values: dummyWorkerValues)

                }

                let registrationValues = ["https://www.example.com", "TEST_ID_active", "TEST_ID_installing", "TEST_ID_waiting", "TEST_ID_redundant"]
                _ = try connection.insert(sql: "INSERT INTO registrations (scope, active, installing, waiting, redundant) VALUES (?,?,?,?,?)", values: registrationValues)


            }

            let reg = try ServiceWorkerRegistration.get(scope: URL(string: "https://www.example.com")!)!

            XCTAssert(reg.active!.id == "TEST_ID_active")
            XCTAssert(reg.installing!.id == "TEST_ID_installing")
            XCTAssert(reg.waiting!.id == "TEST_ID_waiting")
            XCTAssert(reg.redundant!.id == "TEST_ID_redundant")

        }

    }
    
    func testShouldInstallWorker() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(data: """
            
            var installed = false;
            self.addEventListener("install", function() {
                installed = true
            });
            
            """.data(using: String.Encoding.utf8)!, contentType: "text/javascript")
        }
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: TestWeb.serverURL) }
        
        let expect = expectation(description: "Registration completes")
        
        reg!.register(TestWeb.serverURL.appendingPathComponent("test.js")) { err, success in
            XCTAssertNil(err)
            XCTAssertNotNil(reg!.active)
            var installedVal:JSValue? = nil
            AssertNoErrorMessage {
                installedVal = try reg!.active!.executionEnvironment.evaluateScript("installed")
            }
            XCTAssertEqual(installedVal!.toBool(), true)
            expect.fulfill()
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testShouldStayWaitingWhenActiveWorkerExists() {
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "console.log('load')")
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test2.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "console.log('load2')")
        }
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: TestWeb.serverURL) }
        
        let expect = expectation(description: "Registration completes")
        
        reg!.register(TestWeb.serverURL.appendingPathComponent("test.js")) { err, result in
            XCTAssertNil(err)
            let currentActive = reg!.active
            XCTAssertNotNil(currentActive)
            
            reg!.register(TestWeb.serverURL.appendingPathComponent("test2.js")) { err, result in
                XCTAssertNil(err)
                XCTAssertEqual(currentActive, reg!.active)
                XCTAssertNotNil(reg!.waiting)
                XCTAssertEqual(reg!.active!.url.absoluteString, TestWeb.serverURL.appendingPathComponent("test.js").absoluteString)
                XCTAssertEqual(reg!.waiting!.url.absoluteString, TestWeb.serverURL.appendingPathComponent("test2.js").absoluteString)
                expect.fulfill()
            }
        }
        
        wait(for: [expect], timeout: 1)
    }
    
    func testShouldReplaceWhenSkipWaitingCalled() {
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(data: "".data(using: String.Encoding.utf8)!, contentType: "text/javascript")
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test2.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(data: """
                self.addEventListener('install', function() {
                    self.skipWaiting();
                })
            """.data(using: String.Encoding.utf8)!, contentType: "text/javascript")
        }
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: TestWeb.serverURL) }
        
        let expect = expectation(description: "Registration completes")
        
        reg!.register(TestWeb.serverURL.appendingPathComponent("test.js")) { err, result in
            XCTAssertNil(err)
            let currentActive = reg!.active
            XCTAssertNotNil(currentActive)
            
            reg!.register(TestWeb.serverURL.appendingPathComponent("test2.js")) { err, result in
                XCTAssertNil(err)
                XCTAssertEqual(currentActive, reg!.redundant)
                XCTAssertNotNil(reg!.active)
                XCTAssertEqual(reg!.active?.url.absoluteString, TestWeb.serverURL.appendingPathComponent("test2.js").absoluteString)
                XCTAssertEqual(reg!.redundant?.url.absoluteString, TestWeb.serverURL.appendingPathComponent("test.js").absoluteString)
                expect.fulfill()
            }
        }
        
        wait(for: [expect], timeout: 1)
    }
    
    func testShouldBecomeRedundantIfInstallFails() {
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(data: """
                self.addEventListener('install', function(e) {
                    e.waitUntil(new Promise(function(fulfill, reject) {
                        reject(new Error("no"))
                    }))
                })
            """.data(using: String.Encoding.utf8)!, contentType: "text/javascript")
        }
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: TestWeb.serverURL) }
        
        let expect = expectation(description: "Registration fails")
        
        reg!.register(TestWeb.serverURL.appendingPathComponent("test.js")) { err, result in
            XCTAssertNotNil(err)
            XCTAssertNotNil(reg!.redundant)
            expect.fulfill()
        }
        wait(for: [expect], timeout: 1)
    }
    
    func testActiveShouldRemainWhenInstallingWorkerFails() {
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(data: "".data(using: String.Encoding.utf8)!, contentType: "text/javascript")
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test2.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(data: """
                self.addEventListener('install', function() {
                    self.skipWaiting();
                })
                self.addEventListener('activate', function(e) {
                    e.waitUntil(new Promise(function(fulfill,reject) {
                        reject(new Error("no"));
                    }))
                });
            """.data(using: String.Encoding.utf8)!, contentType: "text/javascript")
        }
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: TestWeb.serverURL) }
        
        let expect = expectation(description: "Registration completes")
        
        reg!.register(TestWeb.serverURL.appendingPathComponent("test.js")) { err, result in
            XCTAssertNil(err)
            let currentActive = reg!.active
            XCTAssertNotNil(currentActive)
            
            reg!.register(TestWeb.serverURL.appendingPathComponent("test2.js")) { err, result in
                XCTAssertNotNil(err)
                XCTAssertEqual(currentActive, reg!.active)
                XCTAssertNotNil(reg!.redundant)
                XCTAssertEqual(reg!.active?.url.absoluteString, TestWeb.serverURL.appendingPathComponent("test.js").absoluteString)
                XCTAssertEqual(reg!.redundant?.url.absoluteString, TestWeb.serverURL.appendingPathComponent("test2.js").absoluteString)
                expect.fulfill()
            }
        }
        
        wait(for: [expect], timeout: 1)
    }
    
    func testShouldFailWhenJSDoesNotParse() {
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.js", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(data: "][".data(using: String.Encoding.utf8)!, contentType: "text/javascript")
        }
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: TestWeb.serverURL) }
        
        let expect = expectation(description: "Registration completes")
        
        reg!.register(TestWeb.serverURL.appendingPathComponent("test.js")) { err, result in
            XCTAssertNotNil(err)
            XCTAssertNotNil(reg!.redundant)
            expect.fulfill()
        }
        
        wait(for: [expect], timeout: 1)
    }
    
    
    
}


