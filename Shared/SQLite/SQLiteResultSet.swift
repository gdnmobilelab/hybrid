//
//  SQLiteResultSet.swift
//  Shared
//
//  Created by alastair.coote on 19/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import SQLite3

public class SQLiteResultSet {
    
    fileprivate let statement:OpaquePointer
    fileprivate let columnNames: [String]
    var open = true
    
    init(statement: OpaquePointer) {
        self.statement = statement
        
        let numColumns = sqlite3_column_count(self.statement)
        var columnNames: [String] = []
        
        var currentColumn:Int32 = 0
        
        while currentColumn < numColumns {
            let name = String(cString: sqlite3_column_name(self.statement, currentColumn))
            columnNames.append(name)
            currentColumn = currentColumn + 1
        }
        
        self.columnNames = columnNames
        
    }
    
    public func next() -> Bool {
        return sqlite3_step(self.statement) == SQLITE_ROW
    }
    
    fileprivate func nullCheck(_ idx:Int32) -> Bool {
        return sqlite3_column_type(self.statement, idx) == SQLITE_NULL
    }
    
    fileprivate func idxForColumnName(_ name:String) throws -> Int32 {
        let idx = self.columnNames.index(of: name)
        
        if idx == nil {
            throw ErrorMessage("Column does not exist in result set")
        }
        return Int32(idx!)
    }
    
    public func string(_ name:String) throws -> String? {
        
        let idx = try self.idxForColumnName(name)
        
        if self.nullCheck(idx) {
            return nil
        }
        
        let result = sqlite3_column_text(self.statement, idx)!
        return String(cString: result)
        
    }
    
    public func int(_ name:String) throws -> Int? {
        let idx = try self.idxForColumnName(name)
        
        if self.nullCheck(idx) {
            return nil
        }
        
        let result = sqlite3_column_int(self.statement, idx)
        return Int(result)
    }
    
    public func data(_ name: String) throws -> Data? {
        let idx = try self.idxForColumnName(name)
        
        if self.nullCheck(idx) {
            return nil
        }
        
        let result = sqlite3_column_blob(self.statement, idx)
        let length = sqlite3_column_bytes(self.statement, idx)
        
        return Data(bytes: result!, count: Int(length))
    }
    
    public func url( _ name: String) throws -> URL? {
        let str = try self.string(name)
        if let strVal = str {
            return URL(string: strVal)
        }
        return nil
    }
    
}
