//
//  ServiceWorkerRegistrationTests.swift
//  ServiceWorkerContainerTests
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
import HybridShared
import ServiceWorker
import Shared
@testable import ServiceWorkerContainer

class ServiceWorkerRegistrationTests: XCTestCase {
    
    override func setUp() {
        super.setUp()
    }
    
    override func tearDown() {
        do {
            try FileManager.default.removeItem(at: CoreDatabase.dbPath)
            CoreDatabase.dbMigrationCheckDone = false
        } catch {
            XCTFail(String(describing: error))
        }
        TestDB.delete()
    }
    
    func testCreateBlankRegistration() {
        
        var reg:ServiceWorkerRegistration?
        
        AssertNoErrorMessage {reg = try ServiceWorkerRegistration.create(scope: URL(string:"https://www.example.com")!) }
        XCTAssertEqual(reg!.scope.absoluteString, "https://www.example.com")
        
        // An attempt to create a registration when one already exists should fail
        XCTAssertThrowsError(try ServiceWorkerRegistration.create(scope: URL(string:"https://www.example.com")!))
        
    }
    
    func testShouldPopulateWorkerFields() {

        AssertNoErrorMessage {

            try CoreDatabase.inConnection() { connection in

                try ["active", "installing", "waiting","redundant"].forEach { state in

                    let dummyWorkerValues: [Any] = [
                        "TEST_ID_" + state,
                        "https://www.example.com/worker.js",
                        "DUMMY_HEADERS",
                        "DUMMY_CONTENT",
                        ServiceWorkerInstallState.activated.rawValue
                    ]

                    _ = try connection.insert(sql: "INSERT INTO workers (worker_id, url, headers, content, install_state) VALUES (?,?,?,?,?)", values: dummyWorkerValues)

                }

                let registrationValues = ["https://www.example.com", "TEST_ID_active", "TEST_ID_installing", "TEST_ID_waiting", "TEST_ID_redundant"]
                _ = try connection.insert(sql: "INSERT INTO registrations (scope, active, installing, waiting, redundant) VALUES (?,?,?,?,?)", values: registrationValues)


            }

            let reg = try ServiceWorkerRegistration.get(scope: URL(string: "https://www.example.com")!)!

            XCTAssert(reg.active!.id == "TEST_ID_active")
            XCTAssert(reg.installing!.id == "TEST_ID_installing")
            XCTAssert(reg.waiting!.id == "TEST_ID_waiting")
            XCTAssert(reg.redundant!.id == "TEST_ID_redundant")

        }

    }
    
    
}


