//
//  HybridServiceWorkerTests.swift
//  HybridServiceWorkerTests
//
//  Created by alastair.coote on 06/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import XCTest
@testable import HybridUI

class HybridServiceWorkerTests: XCTestCase {
    
//    override func setUp() {
//        super.setUp()
//        // Put setup code here. This method is called before the invocation of each test method in the class.
//    }
//    
//    override func tearDown() {
//        // Put teardown code here. This method is called after the invocation of each test method in the class.
//        super.tearDown()
//    }
    
    func testExample() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        
        let test = ServiceWorkerContainer()
        let mirror = Mirror(reflecting: test)
        let firstChild = mirror.children[1]
        dump(mirror.children)
        NSLog("hmm")
        
    }
    
//    func testPerformanceExample() {
//        // This is an example of a performance test case.
//        self.measure {
////             Put the code you want to measure the time of here.
//        }
//    }
    
}
