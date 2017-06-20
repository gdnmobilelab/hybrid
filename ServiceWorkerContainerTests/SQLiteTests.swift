//
//  SQLiteTests.swift
//  ServiceWorkerContainerTests
//
//  Created by alastair.coote on 19/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import XCTest
@testable import Shared
import FMDB

class SQLiteTests: XCTestCase {
    
    let dbPath = URL(fileURLWithPath: NSTemporaryDirectory() + "temp.db")
    
    func deleteDB() {
        do {
            if FileManager.default.fileExists(atPath: self.dbPath.path) {
                try FileManager.default.removeItem(atPath: self.dbPath.path)
            }
        } catch {
            fatalError(String(describing: error))
        }
    }
    
    override func setUp() {
        super.setUp()
        self.deleteDB()
        // Put setup code here. This method is called before the invocation of each test method in the class.
    }
    
    override func tearDown() {
        // Put teardown code here. This method is called after the invocation of each test method in the class.
        self.deleteDB()
        super.tearDown()
    }
    
    func testOpenDatabaseConnection() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        
        var conn:SQLiteConnection? = nil
        XCTAssertNoThrow(conn = try SQLiteConnection(self.dbPath))
        XCTAssert(conn!.open == true)
        conn!.close()
        XCTAssert(conn!.open == false)
    }
    
    func testExecQuery() {
        
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(self.dbPath)
            try conn.exec(sql: """
                CREATE TABLE "test-table" (
                    "value" TEXT NOT NULL
                )
            """)
            
            conn.close()
            
            let fm = FMDatabase(url: self.dbPath)
            fm.open()
            let rs = try fm.executeQuery("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='test-table';", values: nil)
            
            rs.next()
            
            XCTAssert(rs.int(forColumnIndex: 0) == 1)
            
            fm.close()
            
        }
        
    }
    
    func testInsertQuery() {
        
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(self.dbPath)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL
                )
            """)
            
            
            try conn.update(sql: "INSERT INTO testtable (val) VALUES (?)", values: ["hello"])
                
            conn.close()
            
            let fm = FMDatabase(url: self.dbPath)
            fm.open()
            let rs = try fm.executeQuery("SELECT * from testtable;", values: nil)
            
            XCTAssert(rs.next() == true)
            
            XCTAssert(rs.string(forColumn: "val")! == "hello")
            
            fm.close()
            
        }
        
    }
    
    func testMultiInsertQuery() {
        
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(self.dbPath)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL
                )
            """)
            
            
            try conn.multiUpdate(sql: "INSERT INTO testtable (val) VALUES (?)", values: [["hello"], ["there"]])
            
            conn.close()
            
            let fm = FMDatabase(url: self.dbPath)
            fm.open()
            let rs = try fm.executeQuery("SELECT * from testtable;", values: nil)
            
            XCTAssert(rs.next() == true)
            
            XCTAssert(rs.string(forColumn: "val")! == "hello")
            
            XCTAssert(rs.next() == true)
            
            XCTAssert(rs.string(forColumn: "val")! == "there")
            
            fm.close()
            
        }
        
    }
    
    func testMultiInsertRollback() {
        
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(self.dbPath)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL
                )
            """)
            
            // Don't support booleans
            XCTAssertThrowsError(try conn.multiUpdate(sql: "INSERT INTO testtable (val) VALUES (?)", values: [["hello"], [true]]))
            
            conn.close()
            
            let fm = FMDatabase(url: self.dbPath)
            fm.open()
            let rs = try fm.executeQuery("SELECT * from testtable;", values: nil)
            
            XCTAssert(rs.next() == false)
            
            
            fm.close()
            
        }
        
    }
    
    func testSelect() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(self.dbPath)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL,
                    "num" INT NOT NULL
                );

                INSERT INTO testtable (val, num) VALUES ("hello", 1), ("there", 2);
            """)
            
            
            let returnedValue = try conn.select(sql: "SELECT * FROM testtable", values: []) { rs -> Int in
                
                XCTAssert(rs.next() == true)
                XCTAssert(try rs.column("val") == "hello")
                XCTAssert(try rs.column("num") == 1)
                
                XCTAssert(rs.next() == true)
                XCTAssert(try rs.column("val") == "there")
                XCTAssert(try rs.column("num") == 2)
                
                return 2
            }
            
            XCTAssert(returnedValue == 2)
            
        }
    }
    
    func testInsert() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(self.dbPath)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL
                );
            """)
            
            var rowId = try conn.insert(sql: "INSERT INTO testtable (val) VALUES (?)", values: ["hello"])
            XCTAssert(rowId == 1)
            rowId = try conn.insert(sql: "INSERT INTO testtable (val) VALUES (?)", values: ["there"])
            XCTAssert(rowId == 2)
            
            
        }
    }
    
    func testBlobStream() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(self.dbPath)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" BLOB NOT NULL
                );
            """)
            
            let rowId = try conn.insert(sql: "INSERT INTO testtable (val) VALUES (?)", values: ["abcdefghijk".data(using: String.Encoding.utf8) as Any])
            
            let stream = conn.openBlobReadStream(table: "testtable", column: "val", row: rowId)
            stream.open()
            
            var testData = Data(count: 3)
            
            _ = testData.withUnsafeMutableBytes { body in
                stream.read(body, maxLength: 3)
            }
            
            
            
            XCTAssert(String(data: testData, encoding: String.Encoding.utf8) == "abc")
            
            _ = testData.withUnsafeMutableBytes { body in
                stream.read(body, maxLength: 3)
            }
            
            XCTAssert(String(data: testData, encoding: String.Encoding.utf8) == "def")
            
            XCTAssert(stream.hasBytesAvailable == true)
            
            var restData = Data(count: 5)
            var amtRead = 0
            _ = restData.withUnsafeMutableBytes { body in
                // Should only read as much data is there, no matter what maxLength is specified
                amtRead = stream.read(body, maxLength: 11)
            }
            
            XCTAssert(amtRead == 5)
            XCTAssert(String(data: restData, encoding: String.Encoding.utf8) == "ghijk")
            XCTAssert(stream.hasBytesAvailable == false)
            
            
            stream.close()
        }
    }
    
}
