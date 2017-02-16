//
//  HybridTests.swift
//  HybridTests
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import XCTest
@testable import HybridUI
import WKWebviewBridge

@objc class TestBridge : NSObject, WKWebviewBridgeProtocol {
    
    let name = "test"
    let insertAs:[String] = []
    
    let exposedMethods = [
        BridgeExposedMethod(name: "simpleReturn"),
        BridgeExposedMethod(
            name: "argumentReturn",
            argumentOptionality: [false],
            returnType: String.self
        )
    ]
    
    func simpleReturn() -> String {
        
        return "this worked"
    }
    
    @objc(argumentReturn:)
    func argumentReturn(arg:String) -> String {
        return arg
    }
    
}


class HybridTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
    }
    
//    func testExample() {
//        // This is an example of a functional test case.
//        // Use XCTAssert and related functions to verify your tests produce the correct results.
//        let c = ServiceWorkerContainer()
//        let m = Mirror(reflecting: c)
//        
//        let hmm = class_getClassMethod(ServiceWorkerContainer.self, "getRegistration")
//        
//        
//        var mc: CUnsignedInt = 0
//        var mlist = class_copyMethodList(ServiceWorkerContainer.self, &mc)!;
//        
//        var i:CUnsignedInt = 0
//        
//        while i < mc {
//        
//            let method = mlist.pointee
//            
//            
//            print("Method #\(i): \(method_getName(mlist.pointee))")
//            
//            mlist = mlist.successor()
//            i = i + 1
//        }
//        
//        m.children.forEach { child in
//            dump(child)
//            let name = child.label
//            let v = child.value as? String
//            if v != nil {
//                NSLog("hmm.")
//            }
//            
//        }
////        dump(m)
//    }
    
    func testThisThing() {
        let test = TestBridge()
        let bridge = WKBridge(mapClasses: [test])
        
        do {
            let result = try bridge.runFunction(classIndex: 0, funcName: "simpleReturn", arguments: [])
            let result2 = try bridge.runFunction(classIndex: 0, funcName: "argumentReturn", arguments: ["this test"])
            NSLog("yes?")
        } catch {
            NSLog(String(describing: error))
        }
        
    }
    
    func testPerformanceExample() {
        // This is an example of a performance test case.
        self.measure {
            // Put the code you want to measure the time of here.
        }
    }
    
}
