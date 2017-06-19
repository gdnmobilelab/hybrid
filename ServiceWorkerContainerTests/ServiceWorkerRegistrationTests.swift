////
////  ServiceWorkerRegistrationTests.swift
////  ServiceWorkerContainerTests
////
////  Created by alastair.coote on 14/06/2017.
////  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
////
//
//import XCTest
//import HybridShared
//import ServiceWorker
//@testable import ServiceWorkerContainer
//
//class ServiceWorkerRegistrationTests: XCTestCase {
//
//    
//    func testCreateBlankRegistration() {
//        
//        AssertNoErrorMessage {
//            let reg = try ServiceWorkerRegistration.create(scope: URL(string:"https://www.example.com")!)
//            XCTAssert(reg.scope.absoluteString == "https://www.example.com")
//        }
//        
//        AssertHasErrorMessage {
//            // An attempt to create a registration when one already exists should fail
//            _ = try ServiceWorkerRegistration.create(scope: URL(string:"https://www.example.com")!)
//        }
//        
//    }
//    
//    func testShouldPopulateWorkerFields() {
//        
//        AssertNoErrorMessage {
//            try Database.inTransaction { db in
//                
//                try ["active", "installing", "waiting","redundant"].forEach { state in
//                    
//                    let dummyWorkerValues: [Any] = [
//                        "TEST_ID_" + state,
//                        "https://www.example.com/worker.js",
//                        "DUMMY_HEADERS",
//                        ServiceWorkerInstallState.activated
//                    ]
//                    
//                    try db.executeUpdate("INSERT INTO workers (worker_id, url, headers, install_state) VALUES (?,?,?,?)", values: dummyWorkerValues)
//                    
//                    
//                }
//                
//                let registrationValues = ["https://www.example.com", "TEST_ID_active", "TEST_ID_installing", "TEST_ID_waiting", "TEST_ID_redundant"]
//                try db.executeUpdate("INSERT INTO registrations (scope, active, installing, waiting, redundant) VALUES (?,?,?,?,?)", values: registrationValues)
//                
//            }
//            
//            let reg = try ServiceWorkerRegistration.get(scope: URL(string: "https://www.example.com")!)!
//            
//            XCTAssert(reg.active!.id == "TEST_ID_active")
//            XCTAssert(reg.installing!.id == "TEST_ID_installing")
//            XCTAssert(reg.waiting!.id == "TEST_ID_waiting")
//            XCTAssert(reg.redundant!.id == "TEST_ID_redundant")
//            
//        }
//        
//    }
//    
//    
//}

