//
//  JSFetchResponse.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 23/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
import JavaScriptCore
@testable import ServiceWorker
import GCDWebServers

class JSFetchResponseTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        TestWeb.createServer()
    }
    
    override func tearDown() {
        TestWeb.destroyServer()
        super.tearDown()
        
    }
    
    func makeContextSuitable(_ funcToRun: @escaping (JSValue?) -> JSValue?) -> AnyObject {
        
        let convention: @convention(block) (JSValue) -> JSValue? = funcToRun
        
        return unsafeBitCast(convention, to: AnyObject.self)
    }
    
    func testShouldAddFetchToGlobal() {
        
        let context = JSContext()!
        JSFetchResponse.applyToContext(context: context)
        XCTAssert(context.objectForKeyedSubscript("fetch").isUndefined == false)
        
    }
    
    func testShouldFetch() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "")
            res!.setValue("TEST-VALUE", forAdditionalHeader: "X-Test-Header")
            return res
        }
        
        let context = JSContext()!
        JSFetchResponse.applyToContext(context: context)
        
        let expect = expectation(description: "Fetch call returns")
        
        let onSuccess = self.makeContextSuitable({ (val: JSValue?) -> JSValue? in
            
            let arr = val!.toArray()!
            
            XCTAssert(arr[0] as! String == "TEST-VALUE")
            XCTAssert(arr[1] as! Bool == true)
            XCTAssert(arr[2] as! Int == 200)
            XCTAssert(arr[3] as! String == "OK")
            expect.fulfill()
            return nil
        })
        
        let fail = self.makeContextSuitable({ (val: JSValue?) -> JSValue? in
            XCTFail(val!.toString())
            return nil
        })
        
        
        context.evaluateScript("""
            function test(url, end, fail) {
                fetch(url)
                .then(function(res) {
                    end([
                        res.headers.get('X-Test-Header'),
                        res.ok,
                        res.status,
                        res.statusText
                    ])
                })
                .catch(fail)
            }
        """)
        
        let url = TestWeb.serverURL.appendingPathComponent("test.txt").absoluteString
        
        context.objectForKeyedSubscript("test").call(withArguments: [url, onSuccess, fail])
        
        wait(for: [expect], timeout: 5)
    }
    
    func testShouldFetchText() {
        
        TestWeb.server!.addHandler(forMethod: "GET", path: "/test.txt", request: GCDWebServerRequest.self) { (request) -> GCDWebServerResponse? in
            let res = GCDWebServerDataResponse(text: "TEST TEXT!")
            res!.setValue("TEST-VALUE", forAdditionalHeader: "X-Test-Header")
            return res
        }
        
        
        
    }
    
}
