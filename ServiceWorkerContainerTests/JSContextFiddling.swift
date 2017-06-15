//
//  JSContextFiddling.swift
//  ServiceWorkerContainerTests
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
import JavaScriptCore
import WebKit

class JSContextFiddling: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
    
    func testExample() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        
        let context = JSContext()!
        
        let test = { () -> String in
//            let c = JSContext
//            let co = context
            context.evaluateScript("var ttt = 'tttAAH';")
            return "hello"
        }
        
        let convention: @convention(block) () -> String = test
        let c = unsafeBitCast(convention, to: AnyObject.self)
        context.setObject(c, forKeyedSubscript: "testFunc" as (NSCopying & NSObjectProtocol)!)
        let val = context.evaluateScript("testFunc(); ttt")
        
        NSLog(val!.toString())
        
    }
    
    
}
