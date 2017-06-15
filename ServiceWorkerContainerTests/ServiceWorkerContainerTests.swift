//
//  ServiceWorkerContainerTests.swift
//  ServiceWorkerContainerTests
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
import CleanroomLogger
import HybridShared
@testable import ServiceWorkerContainer

class DBResetError : Error {}

class ServiceWorkerContainerTests: SWContainerTest {
    
    override func setUp() {
        super.setUp()
        
        do {
            try Database.inTransaction { db in
                let result = db.executeStatements("""
                    DELETE FROM registrations;
                    DELETE FROM workers;
                """)
                
                if !result {
                    throw DBResetError()
                }
            }
        } catch {
            fatalError()
        }

        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        super.tearDown()
        
    }
    
    func containerCreation() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        
        let testContainer = ServiceWorkerContainer(forURL: URL(string: "https://www.example.com")!)
        
        XCTAssert(testContainer.containerURL.absoluteString == "https://www.example.com")
        
    }
    
}
