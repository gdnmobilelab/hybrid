//
//  Migrate.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 23/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import Shared

class Migrate: XCTestCase {
    
    let migrateTempPath = URL(fileURLWithPath: NSTemporaryDirectory()).appendingPathComponent("migrations", isDirectory: true)
    
    override func setUp() {
        super.setUp()
        
        do {
            try FileManager.default.createDirectory(at: self.migrateTempPath, withIntermediateDirectories: true, attributes: nil)
        } catch {
            XCTFail(String(describing: error))
        }
        
        
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        do {
            try FileManager.default.removeItem(at: self.migrateTempPath)
        } catch {
            XCTFail(String(describing: error))
        }
        super.tearDown()
    }
    
    func testBasicMigrations() {
        
        let testMigration = """
            CREATE TABLE test (
                "val" text NOT NULL
            )
        """
        
        let testMigrationTwo = """
            INSERT INTO test VALUES ("success")
        """
        
        XCTAssertNoThrow(try testMigration.data(using: String.Encoding.utf8)!.write(to: self.migrateTempPath.appendingPathComponent("1_one.sql")))
        
        let dbPath = self.migrateTempPath.appendingPathComponent("test.db")
        
        var version = -1
        
        XCTAssertNoThrow(version = try DatabaseMigration.check(dbPath: dbPath, migrationsPath: self.migrateTempPath))
        
        XCTAssertEqual(version, 1)
        
        XCTAssertNoThrow(try testMigrationTwo.data(using: String.Encoding.utf8)!.write(to: self.migrateTempPath.appendingPathComponent("2_two.sql")))
        
        XCTAssertNoThrow(version = try DatabaseMigration.check(dbPath: dbPath, migrationsPath: self.migrateTempPath))
        
        XCTAssertEqual(version, 2)
        
        XCTAssertNoThrow(try SQLiteConnection.inConnection(dbPath) { db in
            try db.select(sql: "SELECT val FROM test") { rs in
                XCTAssertEqual(rs.next(), true)
                XCTAssertEqual(try rs.string("val"),"success")
            }
        })
        
    }
    
    
}
