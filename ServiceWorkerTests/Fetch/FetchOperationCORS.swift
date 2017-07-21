//
//  FetchOperationCORS.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 20/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import GCDWebServers
import JavaScriptCore

class FetchOperationCORSTests: XCTestCase {
    
    override func setUp() { 
        super.setUp()
        URLCache.shared.removeAllCachedResponses()
        TestWeb.createServer()
    }
    
    override func tearDown() {
        TestWeb.destroyServer()
        super.tearDown()
        
    }
    
    func testDisallowedCORSNoOption() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "blah")
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call fails")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error != nil)
            expect.fulfill()
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testDisallowedCORSOptionNoOrigin() {
        
        let serverExpectation = expectation(description: "Fetch call should hit OPTIONS")
    
        TestWeb.server!.addHandler(forMethod: "OPTIONS", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerResponse()
            res.setValue("http://also-not-localhost", forAdditionalHeader: "Access-Control-Allow-Origin")
            serverExpectation.fulfill()
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "blah")
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call fails")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error != nil)
            expect.fulfill()
        }
        
        wait(for: [expect,serverExpectation], timeout: 1)
        
    }
    
    func testAllowedCORSOptionWithSpecificOrigin() {
        
        let serverExpectation = expectation(description: "Fetch call should hit OPTIONS")
        
        TestWeb.server!.addHandler(forMethod: "OPTIONS", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerResponse()
            res.setValue("http://not-localhost", forAdditionalHeader: "Access-Control-Allow-Origin")
            serverExpectation.fulfill()
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "blah")
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call works")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error == nil)
            XCTAssert(response!.responseType == ResponseType.CORS)
            expect.fulfill()
        }
        
        wait(for: [expect,serverExpectation], timeout: 1)
        
    }
    
    func testAllowedCORSOptionWithWildcardOrigin() {
        
        let serverExpectation = expectation(description: "Fetch call should hit OPTIONS")
        
        TestWeb.server!.addHandler(forMethod: "OPTIONS", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerResponse()
            res.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin")
            serverExpectation.fulfill()
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "blah")
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call fails")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error == nil)
            XCTAssert(response!.responseType == ResponseType.CORS)
            expect.fulfill()
        }
        
        wait(for: [expect,serverExpectation], timeout: 1)
        
    }
    
    func testDisallowedCORSOptionMissingMethod() {
        
        let serverExpectation = expectation(description: "Fetch call should hit OPTIONS")
        
        TestWeb.server!.addHandler(forMethod: "OPTIONS", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerResponse()
            res.setValue("http://not-localhost", forAdditionalHeader: "Access-Control-Allow-Origin")
            res.setValue("POST", forAdditionalHeader: "Access-Control-Allow-Methods")
            serverExpectation.fulfill()
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "blah")
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call fails")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error != nil)
            expect.fulfill()
        }
        
        wait(for: [expect,serverExpectation], timeout: 1)
        
    }
    
    func testAllowedCORSOptionWithMethod() {
        
        let serverExpectation = expectation(description: "Fetch call should hit OPTIONS")
        
        TestWeb.server!.addHandler(forMethod: "OPTIONS", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerResponse()
            res.setValue("http://not-localhost", forAdditionalHeader: "Access-Control-Allow-Origin")
            res.setValue("POST, GET", forAdditionalHeader: "Access-Control-Allow-Methods")
            serverExpectation.fulfill()
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "blah")
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call works")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error == nil)
            XCTAssert(response!.responseType == ResponseType.CORS)
            expect.fulfill()
        }
        
        wait(for: [expect,serverExpectation], timeout: 1)
        
    }
    
    func testMissingHeaderWhenNotAllowed() {
        
        let serverExpectation = expectation(description: "Fetch call should hit OPTIONS")
        
        TestWeb.server!.addHandler(forMethod: "OPTIONS", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerResponse()
            res.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin")
            serverExpectation.fulfill()
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "blah")!
            res.setValue("TESTVALUE", forAdditionalHeader: "X-Additional-Header")
            res.setValue("TESTVALUE2", forAdditionalHeader: "X-Header-Two")
            return res
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call is missing header")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error == nil)
            XCTAssert(response!.responseType == ResponseType.CORS)
            XCTAssertNil(response!.headers.get("X-Additional-Header"))
            XCTAssertNil(response!.headers.get("X-Header-Two"))
            expect.fulfill()
        }
        
        wait(for: [expect,serverExpectation], timeout: 1)
        
    }
    
    func testHasHeaderWhenAllowed() {
        
        let serverExpectation = expectation(description: "Fetch call should hit OPTIONS")
        
        TestWeb.server!.addHandler(forMethod: "OPTIONS", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerResponse()
            res.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin")
            res.setValue("X-Additional-Header, X-Header-Two", forAdditionalHeader: "Access-Control-Expose-Headers")
            serverExpectation.fulfill()
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "blah")!
            res.setValue("TESTVALUE", forAdditionalHeader: "X-Additional-Header")
            res.setValue("TESTVALUE2", forAdditionalHeader: "X-Header-Two")
            return res
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        
        let expect = expectation(description: "Fetch call is missing header")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error == nil)
            XCTAssert(response!.responseType == ResponseType.CORS)
            XCTAssertEqual(response!.headers.get("X-Additional-Header"), "TESTVALUE")
            XCTAssertEqual(response!.headers.get("X-Header-Two"), "TESTVALUE2")
            expect.fulfill()
        }
        
        wait(for: [expect,serverExpectation], timeout: 1)
        
    }
    
    func testAllowsOpaqueCORSResponse() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(text: "blah")
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://not-localhost")
        request.mode = .NoCORS
        
        let expect = expectation(description: "Fetch call works")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error == nil)
            XCTAssert(response!.responseType == .Opaque)
            
            response!.text { err, text in
                XCTAssert(err == nil)
                XCTAssertEqual(text, "")
                expect.fulfill()
            }
            
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testReturnsBasicResponseWhenSameDomain() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "blah")!
            res.setValue("TEST", forAdditionalHeader: "X-Custom-Header")
            return res
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        request.origin = URL(string: "http://localhost")
        request.mode = .NoCORS
        
        let expect = expectation(description: "Fetch call works")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(error == nil)
            XCTAssertEqual(response!.headers.get("X-Custom-Header"), "TEST")
            XCTAssert(response!.responseType == .Basic)
            
            expect.fulfill()
            
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    
}
