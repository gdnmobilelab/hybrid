//
//  FetchOperation.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 14/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import GCDWebServers
import Gzip

class FetchOperationTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        URLCache.shared.removeAllCachedResponses()
        TestWeb.createServer()
    }
    
    override func tearDown() {
        TestWeb.destroyServer()
        super.tearDown()
        
    }
    
    func testSimpleFetch() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(jsonObject: [
                "blah": "value"
            ])
            res!.statusCode = 201
            res!.setValue("TEST-VALUE", forAdditionalHeader: "X-Test-Header")
            return res
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
       
        let expect = expectation(description: "Fetch call returns")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(response != nil)
            XCTAssertEqual(response!.status,201)
            XCTAssertEqual(response!.headers.get("X-Test-Header"), "TEST-VALUE")
            expect.fulfill()
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testFailedFetch() {
        
        let expect = expectation(description: "Fetch call returns")
        
        FetchOperation.fetch("http://localhost:23423") { error, response in
            XCTAssert(error != nil)
            expect.fulfill()
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    fileprivate func setupRedirectURLs() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "THIS IS TEST CONTENT")
            res!.statusCode = 201
            return res
        }
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/redirect-me", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            
            let res = GCDWebServerDataResponse(text: "THIS IS TEST CONTENT")
            res!.statusCode = 301
            res!.setValue("/test.txt", forAdditionalHeader: "Location")
            return res
        }
    
    }

    
    func testRedirectFetch() {
        
        self.setupRedirectURLs()
        
        let expectRedirect = expectation(description: "Fetch call returns")
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/redirect-me"))
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(response != nil)
            XCTAssertEqual(response!.status, 201)
            XCTAssert(response!.url == TestWeb.serverURL.appendingPathComponent("/test.txt").absoluteString)
            expectRedirect.fulfill()
        }
        
        
        wait(for: [expectRedirect], timeout: 10)
        
    }
    
    func testRedirectNoFollow() {
        self.setupRedirectURLs()
        
        let expectNotRedirect = expectation(description: "Fetch call does not redirect")
        
        let noRedirectRequest = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/redirect-me"))
        noRedirectRequest.redirect = .Manual
        
        FetchOperation.fetch(noRedirectRequest) { error, response in
            XCTAssert(response != nil, "Response should exist")
            XCTAssert(response!.status == 301, "Should be a 301 status")
            XCTAssert(response!.headers.get("Location") == "/test.txt", "URL should be correct")
            XCTAssert(response!.url == TestWeb.serverURL.appendingPathComponent("/redirect-me").absoluteString)
            expectNotRedirect.fulfill()
        }
        
        wait(for: [expectNotRedirect], timeout: 10)
    }
    
    func testRedirectError() {
        self.setupRedirectURLs()
        
        let expectError = expectation(description: "Fetch call errors on redirect")
        
        let errorRequest = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/redirect-me"))
        errorRequest.redirect = .Error
        
        FetchOperation.fetch(errorRequest) { error, response in
            let errString = String(describing: error!)
            XCTAssert(error != nil, "Error should exist")
            expectError.fulfill()
        }
        
        wait(for: [expectError], timeout: 100)
    }
    
    func testFetchRequestBody() {
        
        let expectResponse = expectation(description: "Request body is received")
        
        
        TestWeb.server!.addHandler(forMethod: "POST", path: "/post", request: GCDWebServerDataRequest.self) { (request) -> GCDWebServerResponse? in
            let dataReq = request as! GCDWebServerDataRequest
            
            let str = String(data: dataReq.data, encoding: String.Encoding.utf8)
            XCTAssert(str == "TEST STRING")
            
            let res = GCDWebServerResponse(statusCode: 200)
            expectResponse.fulfill()
            return res
        }
        
        let postRequest = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/post"))
        postRequest.body = "TEST STRING".data(using: String.Encoding.utf8)
        postRequest.method = "POST"
        
        FetchOperation.fetch(postRequest) { error, response in
            XCTAssert(error == nil, "Should not error")
        }
        
        wait(for: [expectResponse], timeout: 1)
    }
    

}
