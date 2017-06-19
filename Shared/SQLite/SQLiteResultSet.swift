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
    
    func next() -> Bool {
        return sqlite3_step(self.statement) == SQLITE_ROW
    }
    
    func column<T>(_ name:String) throws -> T {
        
        let idx = self.columnNames.index(of: name)
        
        if idx == nil {
            throw ErrorMessage("Column does not exist in result set")
        }
        
        if T.self == String.self {
            let result = sqlite3_column_text(self.statement, Int32(idx!))!
            return String(cString: result) as! T
        } else if T.self == Int.self {
            let result = sqlite3_column_int(self.statement, Int32(idx!))
            return Int(result) as! T
        } else {
            throw ErrorMessage("Do not know how to return this data type")
        }
        
    }
    
}
