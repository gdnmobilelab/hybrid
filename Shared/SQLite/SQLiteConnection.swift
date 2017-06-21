//
//  SQLiteConnection.swift
//  Shared
//
//  Created by alastair.coote on 19/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import SQLite3

public class SQLiteConnection {
    
    var db:OpaquePointer? = nil
    var open:Bool
    
    public init(_ dbURL:URL) throws {
        
        if sqlite3_open(dbURL.path.cString(using: String.Encoding.utf8), &self.db) != SQLITE_OK {
            throw ErrorMessage("Could not create SQLite database instance")
        }
        
        self.open = true
    }
    
    public func close() {
        self.open = false
        sqlite3_close(self.db!)
    }
    
    fileprivate func throwSQLiteError(_ err: UnsafeMutablePointer<Int8>) throws {
        let errMsg = String(cString: err)
        sqlite3_free(err)
        throw ErrorMessage("SQLite ERROR: \(errMsg)")
    }
    
    public func exec(sql:String) throws {
        
        try self.inTransaction {
            var zErrMsg:UnsafeMutablePointer<Int8>?
            let rc = sqlite3_exec(self.db!, sql, nil, nil, &zErrMsg)
            if rc != SQLITE_OK {
                try self.throwSQLiteError(zErrMsg!)
            }
        }
        
    }
    
    public func inTransaction<T>(_ closure: () throws -> T) throws -> T {
        
        var zErrMsg:UnsafeMutablePointer<Int8>?
        var rc = sqlite3_exec(self.db!, "BEGIN TRANSACTION;", nil, nil, &zErrMsg)
        
        if rc != SQLITE_OK {
            try self.throwSQLiteError(zErrMsg!)
        }
        
        var result:T?
        
        do {
            result = try closure()
            rc = sqlite3_exec(self.db!, "; COMMIT TRANSACTION;", nil, nil, &zErrMsg)
        } catch {
            rc = sqlite3_exec(self.db!,"; ROLLBACK TRANSACTION;", nil,nil, &zErrMsg)
            throw error
        }
        
        if rc != SQLITE_OK {
            try self.throwSQLiteError(zErrMsg!)
        }
        
        return result!
        
    }
    
    fileprivate func bindValue(_ statement: OpaquePointer, idx:Int32, value:Any) throws {
        
        if let int32Value = value as? Int32 {
            sqlite3_bind_int(statement, idx, int32Value)
        } else if let intValue = value as? Int {
            sqlite3_bind_int(statement, idx, Int32(intValue))
        } else if let stringValue = value as? String {
            sqlite3_bind_text(statement, idx, stringValue.cString(using: String.Encoding.utf8), -1, nil)
        } else if let dataValue = value as? Data {
            _ = dataValue.withUnsafeBytes { body in
                sqlite3_bind_blob(statement, idx, body, Int32(dataValue.count), nil)
            }
        } else {
            throw ErrorMessage("Did not understand input data type")
        }
    }
    
    fileprivate func getLastError() -> ErrorMessage {
        let errMsg = String(cString: sqlite3_errmsg(self.db!))
        return ErrorMessage(errMsg)
    }
    
    public func multiUpdate(sql:String, values: [[Any]]) throws {
        
        var statement: OpaquePointer? = nil
        
        if sqlite3_prepare_v2(self.db!, sql + ";", -1, &statement, nil) != SQLITE_OK {
            sqlite3_finalize(statement)
            throw self.getLastError()
        }
        
        try self.inTransaction {
            
            for valueArray in values {
                
                for (offset, element) in valueArray.enumerated() {
                    // SQLite uses non-zero index for parameter numbers
                    try self.bindValue(statement!, idx: Int32(offset) + 1, value: element)
                }
                
                if sqlite3_step(statement) != SQLITE_DONE {
                    sqlite3_finalize(statement)
                    throw self.getLastError()
                }
                
                sqlite3_reset(statement)
                
            }
            
            sqlite3_finalize(statement)
            
        }
        
    }
    
    public func update(sql:String, values: [Any]) throws {
        try self.multiUpdate(sql: sql, values: [values])
    }
    
    public func insert(sql:String, values: [Any]) throws -> Int64 {
        try self.multiUpdate(sql: sql, values: [values])
        
        return sqlite3_last_insert_rowid(self.db!)
    }
    
    public func select<T>(sql:String, values: [Any], _ cb: (SQLiteResultSet) throws -> T) throws -> T {
        
        var statement: OpaquePointer? = nil
        
        if sqlite3_prepare_v2(self.db!, sql + ";", -1, &statement, nil) != SQLITE_OK {
            sqlite3_finalize(statement)
            throw self.getLastError()
        }
        
        for (offset, element) in values.enumerated() {
            try self.bindValue(statement!, idx: Int32(offset) + 1, value: element)
        }
        
        let rs = SQLiteResultSet(statement: statement!)
        
        let result = try cb(rs)
        rs.open = false
        
        sqlite3_finalize(statement)
        
        return result
        
    }
    
    public func select<T>(sql:String, _ cb: (SQLiteResultSet) throws -> T) throws -> T {
        return try self.select(sql: sql, values: [], cb)
    }
    
    public func openBlobReadStream(table: String, column:String, row: Int64) -> SQLiteBlobReadStream {
        
        return SQLiteBlobReadStream(self.db!, table: table, column: column, row: row)
        
    }
    
    public func openBlobWriteStream(table: String, column:String, row: Int64) -> SQLiteBlobWriteStream {
        
        return SQLiteBlobWriteStream(self.db!, table: table, column: column, row: row)
        
    }
    
}
