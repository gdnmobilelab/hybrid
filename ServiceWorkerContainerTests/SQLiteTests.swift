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
    
    override func tearDown() {
        TestDB.delete()
        super.tearDown()
    }
    
    func testOpenDatabaseConnection() {
        // This is an example of a functional test case.
        // Use XCTAssert and related functions to verify your tests produce the correct results.
        
        var conn:SQLiteConnection? = nil
        XCTAssertNoThrow(conn = try SQLiteConnection(TestDB.path))
        XCTAssert(conn!.open == true)
        conn!.close()
        XCTAssert(conn!.open == false)
    }
    
    func testExecQuery() {
        
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
            try conn.exec(sql: """
                CREATE TABLE "test-table" (
                    "value" TEXT NOT NULL
                )
            """)
            
            conn.close()
            
            let fm = FMDatabase(url: TestDB.path)
            fm.open()
            let rs = try fm.executeQuery("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='test-table';", values: nil)
            
            rs.next()
            
            XCTAssert(rs.int(forColumnIndex: 0) == 1)
            
            fm.close()
            
        }
        
    }
    
    func testInsertQuery() {
        
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL
                )
            """)
            
            
            try conn.update(sql: "INSERT INTO testtable (val) VALUES (?)", values: ["hello"])
                
            conn.close()
            
            let fm = FMDatabase(url: TestDB.path)
            fm.open()
            let rs = try fm.executeQuery("SELECT * from testtable;", values: nil)
            
            XCTAssert(rs.next() == true)
            
            XCTAssert(rs.string(forColumn: "val")! == "hello")
            
            fm.close()
            
        }
        
    }
    
    func testMultiInsertQuery() {
        
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL
                )
            """)
            
            
            try conn.multiUpdate(sql: "INSERT INTO testtable (val) VALUES (?)", values: [["hello"], ["there"]])
            
            conn.close()
            
            let fm = FMDatabase(url: TestDB.path)
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
            
           XCTAssertThrowsError(try SQLiteConnection.inConnection(TestDB.path, { conn in
            
                try conn.exec(sql: """
                    CREATE TABLE "testtable" (
                        "val" TEXT NOT NULL
                    )
                """)
            
                try conn.inTransaction {
                    
                    // Don't support booleans
                    
                    try conn.multiUpdate(sql: "INSERT INTO testtable (val) VALUES (?)", values: [["hello"], [true]])

                }
                
            }))
            
            let fm = FMDatabase(url: TestDB.path)
            fm.open()
            let rs = try fm.executeQuery("SELECT * from testtable;", values: nil)
            
            let hasRow = rs.next()
            
//            if hasRow == true {
//                let val = rs.string(forColumn: "val")!
//                NSLog(val)
//            }
            
            
            XCTAssert(hasRow == false)
            rs.close()
            
            fm.close()
            
        }
        
    }
    
    func testSelect() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NOT NULL PRIMARY KEY,
                    "num" INT NOT NULL,
                    "blobtexttest" BLOB NOT NULL
                );
            """)
            
            try conn.multiUpdate(sql: "INSERT INTO testtable (val, num, blobtexttest) VALUES (?,?,?);", values: [["hello", 1,"blobtest"],["there", 2, "blobtest2"]])
            
            
            let returnedValue = try conn.select(sql: "SELECT * FROM testtable", values: []) { rs -> Int in
                
                XCTAssert(rs.next() == true)
                XCTAssert(try rs.string("val") == "hello")
                XCTAssert(try rs.int("num") == 1)
                XCTAssert(try rs.string("blobtexttest") == "blobtest")
                
                XCTAssert(rs.next() == true)
                XCTAssert(try rs.string("val") == "there")
                XCTAssert(try rs.int("num") == 2)
                
                return 2
            }
            
            XCTAssert(returnedValue == 2)
            
        }
    }
    
    func testSelectOfOptionalTypes() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" TEXT NULL
                );

                INSERT INTO testtable (val) VALUES (NULL);
            """)
            
            
            _ = try conn.select(sql: "SELECT * FROM testtable", values: []) { rs in
                
                XCTAssert(rs.next() == true)
                XCTAssert(try rs.string("val") == nil)
                
            }
            
            
        }
    }
    
    func testInsert() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
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
    
    func testBlobReadStream() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
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
    
    func testBlobWriteStream() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
            try conn.exec(sql: """
                CREATE TABLE "testtable" (
                    "val" BLOB NOT NULL
                );
            """)
            
            
            
            let rowId = try conn.insert(sql: "INSERT INTO testtable (val) VALUES ('aaaaaaaaaaa')", values: [])
            
            let stream = conn.openBlobWriteStream(table: "testtable", column: "val", row: rowId)
            stream.open()
            _ = "abc".data(using: String.Encoding.utf8)!.withUnsafeBytes { body in
                XCTAssert(stream.write(body, maxLength: 3) == 3)
            }

            _ = "def".data(using: String.Encoding.utf8)!.withUnsafeBytes { body in
                stream.write(body, maxLength: 3)
            }

            _ = "ghijk".data(using: String.Encoding.utf8)!.withUnsafeBytes { body in
                stream.write(body, maxLength: 5)
            }

            stream.close()
            
            try conn.select(sql: "SELECT val FROM testtable", values: []) { rs in
                XCTAssert( rs.next() == true)
                let data = try rs.data("val")!
                let asStr = String(data: data, encoding: String.Encoding.utf8)
                XCTAssert(asStr! == "abcdefghijk")
            }
        }
    }
    
    func testUpdateMonitor() {
        AssertNoErrorMessage {
            let conn = try SQLiteConnection(TestDB.path)
            try conn.exec(sql: """
                    CREATE TABLE "testtable" (
                        "val" TEXT NOT NULL
                    );
                """)
            
            let monitor = SQLiteUpdateMonitor(conn)
            
            var insertListenerFired = false
            var listenerID = monitor.addListener { (operation, tableName, rowId) in
                insertListenerFired = true
                XCTAssert(operation == SQLiteUpdateOperation.Insert)
                XCTAssert(tableName == "testtable")
                XCTAssert(rowId == 1)
            }
            
            try conn.exec(sql: "INSERT INTO testtable (val) VALUES ('test')")
            XCTAssert(insertListenerFired == true)
            monitor.removeListener(listenerID)
            
            var updateListenerFired = false
            
            listenerID = monitor.addListener { (operation, tableName, rowId) in
                updateListenerFired = true
                XCTAssert(operation == SQLiteUpdateOperation.Update)
                XCTAssert(tableName == "testtable")
                XCTAssert(rowId == 1)
            }
            
            try conn.exec(sql: "UPDATE testtable SET val = 'new-test'")
            XCTAssert(updateListenerFired == true)
            monitor.removeListener(listenerID)
        
            
            
        }
    }
    
    
}
