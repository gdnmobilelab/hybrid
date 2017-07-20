//
//  FetchResponse.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 14/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import ServiceWorker
import GCDWebServers
import Gzip
import JavaScriptCore
import Shared

class FetchResponseTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        TestWeb.createServer()
    }
    
    override func tearDown() {
        TestWeb.destroyServer()
        super.tearDown()
        
    }
    
    func testFetchResponseText() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "THIS IS TEST CONTENT")
            res!.statusCode = 200
            return res
        }
        let expectResponse = expectation(description: "Response body is received")
        
        FetchOperation.fetch(TestWeb.serverURL.appendingPathComponent("/test.txt").absoluteString) { err, res in
            XCTAssert(err == nil)
            res!.text { err, str in
                XCTAssert(err == nil)
                XCTAssert(str == "THIS IS TEST CONTENT")
                expectResponse.fulfill()
            }
            
        }
        
        wait(for: [expectResponse], timeout: 100)
        
        
    }
    
    func testGzipResponse() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test-gzip.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            
            var res:GCDWebServerDataResponse? = nil
            
            do {
                let gzipped = try "THIS IS TEST CONTENT".data(using: String.Encoding.utf8)!.gzipped()
                
                res = GCDWebServerDataResponse(data: gzipped, contentType: "text/plain")
                res!.setValue("gzip", forAdditionalHeader: "Content-Encoding")
                res!.statusCode = 200
                
            } catch {
                XCTFail(String(describing: error))
            }
            return res
        }
        
        let request = FetchRequest(url: TestWeb.serverURL.appendingPathComponent("/test-gzip.txt"))
        
        let expect = expectation(description: "Fetch call returns")
        
        FetchOperation.fetch(request) { error, response in
            XCTAssert(response != nil, "Response should exist")
            let lengthInHeader = response?.headers.get("Content-Length")
            XCTAssert(lengthInHeader == "20")
            
            response!.text { err, text in
                XCTAssert(text == "THIS IS TEST CONTENT")
                expect.fulfill()
            }
            
        }
        
        wait(for: [expect], timeout: 1)
        
    }
    
    func testFetchResponseJSON() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.json", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(jsonObject: [
                "test":"value"
            ])
            res!.statusCode = 200
            return res
        }
        let expectResponse = expectation(description: "Response body is received")
        
        FetchOperation.fetch(TestWeb.serverURL.appendingPathComponent("/test.json").absoluteString) { err, res in
            XCTAssert(err == nil)
            res!.json { err, obj in
                
                XCTAssert(err == nil)
                
                let json = obj as! [String: Any]
                
                XCTAssertEqual(json["test"] as! String, "value")
                expectResponse.fulfill()
            }
            
        }
        
        wait(for: [expectResponse], timeout: 1)
        
    }
    
    func testResponseInJSContext() {
        
        let context = JSContext()!
        
        FetchOperation.addToJSContext(context: context)
        
        let expectResponse = expectation(description: "Response body is received via JS")

        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "THIS IS TEST CONTENT")
            res!.statusCode = 200
            return res
        }
        
        let promise = context.evaluateScript("""
            fetch('\(TestWeb.serverURL.appendingPathComponent("/test.txt"))')
            .then(function(res) { return res.text() })
        """)!
        
        JSPromise.resolve(promise) { err, val in
            XCTAssert(err == nil)
            XCTAssertEqual(val!.toString(),"THIS IS TEST CONTENT")
            expectResponse.fulfill()
        }
        
        
        wait(for: [expectResponse], timeout: 1)

    }
    
}
