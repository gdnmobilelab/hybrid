//
//  WebSQLDatabase.swift
//  hybrid
//
//  Created by alastair.coote on 07/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared
import PromiseKit
import FMDB
import JavaScriptCore

@objc protocol WebSQLDatabaseExports: JSExport {
    func exec(_ queries: [[String:AnyObject]], readOnly: Bool, callback: JSValue)
}


/// Obj-C functionality that is used in js-src's websql.ts.
@objc class WebSQLDatabase: NSObject, WebSQLDatabaseExports {
    
    let db:FMDatabase
    let context:JSContext
    
    init(dbPath: String, context:JSContext)  {
        self.db = FMDatabase(path: dbPath)
        self.context = context
        self.db.open()
    }
    
    
    
    fileprivate func runQuery(_ query:String, args: [AnyObject]?) -> WebSQLResultSet {
        NSLog(query)
        let resultSet = WebSQLResultSet()
        
        do {
            let isSelect = query.hasPrefix("SELECT ")
            
            if isSelect == true {
                
                let fmResultSet = try self.db.executeQuery(query, values: args)
                
                // grab column names
                
                var columns = [String]()
                
                var columnIndex:Int32 = 0
                
                while columnIndex < fmResultSet.columnCount() {
                    columns.append(fmResultSet.columnName(for: columnIndex))
                    columnIndex = columnIndex + 1
                }
                
                while fmResultSet.next() {
                    
                    var row = [String : AnyObject]()
                    
                    for column in columns {
                        row[column] = fmResultSet.object(forColumnName: column) as AnyObject?
                    }
                    
                    resultSet.rows.append(row)
                }
            } else {
                try self.db.executeUpdate(query, values: args)
                resultSet.insertId = NSNumber(value: self.db.lastInsertRowId() as Int64)
                resultSet.rowsAffected = NSNumber(value: self.db.changes() as Int32)
            }
        } catch {
            resultSet.error = JSValue(newErrorFromMessage: String(describing: error), in: self.context)
        }
        
        return resultSet
    }
    
    /// Implementation of https://www.w3.org/TR/webdatabase/#dom-sqltransaction-sync-executesql
    ///
    /// - Parameters:
    ///   - query: The text SQL query
    ///   - args: The values to pass into the query (substituting ? values)
    /// - Returns: A result set for the completed query, with the error property set if an error occurred.
    func exec(_ queries: [[String : AnyObject]], readOnly: Bool, callback: JSValue) {
        
        var resultSets = [WebSQLResultSet]()
        
        for query in queries {
            let rs = self.runQuery(query["sql"] as! String, args: query["args"] as? [AnyObject])
            resultSets.append(rs)
        }
        
        // Don't quite understand the API here, but the callback has error as the first argument.
        // So if any of our result sets have errors, we'll just send the first one.
        
        let resultSetsWithErrors = resultSets.filter { rs in
            return rs.error != nil
        }
        
        if resultSetsWithErrors.count > 0 {
            callback.call(withArguments: [resultSetsWithErrors[0]])
        } else {
            callback.call(withArguments: [JSValue(undefinedIn: self.context), resultSets])
        }
    }
    
}
