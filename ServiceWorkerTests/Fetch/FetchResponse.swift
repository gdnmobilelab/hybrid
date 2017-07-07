//
//  FetchResponse.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 22/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import GCDWebServers

class FetchResponseTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        TestWeb.createServer()
    }
    
    override func tearDown() {
        TestWeb.destroyServer()
        super.tearDown()
        
    }
    
    func testFetchError() {
        
        let expect = expectation(description: "Fetch call errors out")
        
        let request = FetchRequest(url: URL(string: "http://blah")!)
        FetchResponse.fetch(fromRequest: request) { err, response in
            XCTAssert(err != nil)
            expect.fulfill()
            
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testSimpleFetch() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "THIS IS TEST CONTENT")
            res!.setValue("TEST-VALUE", forAdditionalHeader: "X-Test-Header")
            return res
        }
        
        let expect = expectation(description: "Fetch call returns")
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.txt"))
        FetchResponse.fetch(fromRequest: request) { err, response in
            XCTAssert(err == nil, "Should not error")
            XCTAssert(response.headers!.get("X-Test-Header") == "TEST-VALUE", "Should pass headers through to FetchHeaders object")
            XCTAssert(response.statusText == "OK", "Status text should be correctly chosen")
            
            response.text() { err, str in
                XCTAssert(err == nil, "text() call should not error")
                XCTAssert(str! == "THIS IS TEST CONTENT", "Text content should match the body we provided")
                
                expect.fulfill()
            }
            
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testJSONFetch() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.json", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            return GCDWebServerDataResponse(jsonObject: ["test": "HELLO"])
        }
        
        let expect = expectation(description: "Fetch call returns")
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test.json"))
        FetchResponse.fetch(fromRequest: request) { err, response in
            XCTAssert(err == nil, "Should not error")
            
            response.json() { err, json in
                XCTAssert(err == nil)
                let test = (json as! [String:Any])["test"]
                XCTAssert(test as? String == "HELLO")
                expect.fulfill()
            }
            
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    
    
}
