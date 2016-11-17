//
//  ServiceWorkerWebSql.swift
//  hybrid
//
//  Created by alastair.coote on 12/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import FMDB
import JavaScriptCore

@objc protocol WebSQLDatabaseCreatorExports : JSExport {
    func createDB(name:String) -> [AnyObject]
}


/// While service workers don't implement WebSQL, there are no independent implementations of IndexedDB
/// we can use in the workers. So instead, we implement WebSQL on top of FMDB, then use a JS shim to
/// provide IndexedDB functionality, backed by WebSQL.
@objc class WebSQLDatabaseCreator: NSObject, WebSQLDatabaseCreatorExports {
    
    let origin:String
    let context:JSContext
    let sanitisedOrigin:String
    
    init(context:JSContext, origin:String) {
        
        self.origin = origin
        self.context = context
        
        // We do a regex replace to switch out any non-valid filename chars. Then we can use
        // this name as a directory to store our DBs in.
        
        let sanitisedOrigin = NSMutableString(string: origin)
        
        var regex:NSRegularExpression?
        
        do {
            regex = try NSRegularExpression(pattern: "([^A-Za-z0-9]*)", options: .CaseInsensitive)
        } catch {
            log.error("Regex could not be created. This should never happen.")
        }
        
        regex!.replaceMatchesInString(sanitisedOrigin, options: [], range: NSRange(0..<origin.utf16.count), withTemplate: "")
        
        self.sanitisedOrigin = sanitisedOrigin as String
        
        super.init()
        
        self.context.setObject(self, forKeyedSubscript: "__WebSQLDatabaseCreator")
    }
    
    
    /// Create our WebSQL database
    ///
    /// - Parameter name: Name of the database. Is used as the DB filename
    /// - Returns: An two-item array. First item is an error, if it exists. Second is the DB instance, if there is no error.
    func createDB(name:String) -> [AnyObject] {
        
        // JSExport doesn't like functions that throw, so we're passing back an array
        // of the error and DB
        
        do {
            let dbPath = try Db.getFullPathForDB(name, inDirectory: self.sanitisedOrigin)
            let db = WebSQLDatabase(dbPath: dbPath.path!, context: self.context)
            return [JSValue(nullInContext:self.context), db]
        } catch {
            return [JSValue(newErrorFromMessage: String(error), inContext: self.context)]
        }
    }
}

@objc protocol WebSQLResultSetExports : JSExport {
    var error:JSValue? {get}
    var insertId:NSNumber? {get}
    var rowsAffected:NSNumber {get}
    var rows: [[String : AnyObject]] {get}
}



/// Implementation of SQLResultSet: https://www.w3.org/TR/webdatabase/#sqlresultset
@objc class WebSQLResultSet : NSObject, WebSQLResultSetExports {
    var error:JSValue? = nil
    var insertId:NSNumber? = nil
    var rowsAffected:NSNumber = 0
    var rows: [[String : AnyObject]] = [[String : AnyObject]]()
}

@objc protocol WebSQLDatabaseExports: JSExport {
    func exec(queries: [[String:AnyObject]], readOnly: Bool, callback: JSValue)
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
    
    
    
    private func runQuery(query:String, args: [AnyObject]?) -> WebSQLResultSet {
        
        let resultSet = WebSQLResultSet()
        
        do {
            let isSelect = query.hasPrefix("SELECT ")
            
            if isSelect == true {
                
                let fmResultSet = try self.db.executeQuery(query, values: args)
                
                // grab column names
                
                var columns = [String]()
                
                var columnIndex:Int32 = 0
                
                while columnIndex < fmResultSet.columnCount() {
                    columns.append(fmResultSet.columnNameForIndex(columnIndex))
                    columnIndex = columnIndex + 1
                }
                
                while fmResultSet.next() {
                    
                    var row = [String : AnyObject]()
                    
                    for column in columns {
                        row[column] = fmResultSet.objectForColumnName(column)
                    }
                    
                    resultSet.rows.append(row)
                }
            } else {
                try self.db.executeUpdate(query, values: args)
                resultSet.insertId = NSNumber(longLong: self.db.lastInsertRowId())
                resultSet.rowsAffected = NSNumber(int: self.db.changes())
            }
        } catch {
            resultSet.error = JSValue(newErrorFromMessage: String(error), inContext: self.context)
        }
        
        return resultSet
    }
    
    /// Implementation of https://www.w3.org/TR/webdatabase/#dom-sqltransaction-sync-executesql
    ///
    /// - Parameters:
    ///   - query: The text SQL query
    ///   - args: The values to pass into the query (substituting ? values)
    /// - Returns: A result set for the completed query, with the error property set if an error occurred.
    func exec(queries: [[String : AnyObject]], readOnly: Bool, callback: JSValue) {
        
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
            callback.callWithArguments([resultSetsWithErrors[0]])
        } else {
            callback.callWithArguments([JSValue(undefinedInContext: self.context), resultSets])
        }
    }

}
