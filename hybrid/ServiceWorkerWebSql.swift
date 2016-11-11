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

@objc class WebSQLDatabaseCreator: NSObject, WebSQLDatabaseCreatorExports {
    
    // We need to store DBs based on origin, but the actual webview doesn't have the
    // correct URL for this (it has the localhost one) so this is quick wrapper
    // class allowing us to create a DB in the webview.
    
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
    
    func createDB(name:String) -> [AnyObject] {
        
        // JSExport doesn't like functions that throw, so we're passing back an array
        // of the error and DB
        
        do {
            let dbPath = try Db.getFullDatabasePath(self.sanitisedOrigin, dbFilename: name)
            let db = WebSQLDatabase(dbPath: dbPath, context: self.context)
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

@objc class WebSQLResultSet : NSObject, WebSQLResultSetExports {
    var error:JSValue? = nil
    var insertId:NSNumber? = nil
    var rowsAffected:NSNumber = 0
    var rows: [[String : AnyObject]] = [[String : AnyObject]]()
}

@objc protocol WebSQLDatabaseExports: JSExport {
    func exec(queries: [[String:AnyObject]], readOnly: Bool, callback: JSValue)
}


@objc class WebSQLDatabase: NSObject, WebSQLDatabaseExports {
    
    let db:FMDatabase
    let context:JSContext
    
    init(dbPath: String, context:JSContext)  {
        self.db = FMDatabase(path: dbPath)
        self.context = context
        self.db.open()
    }
    
    func runQuery(query:String, args: [AnyObject]?) -> WebSQLResultSet {
        
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
    
    func exec(queries: [[String : AnyObject]], readOnly: Bool, callback: JSValue) {
//        self.db.beginTransaction()
        
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
//            self.db.rollback()
            callback.callWithArguments([resultSetsWithErrors[0]])
        } else {
//            self.db.commit()
            callback.callWithArguments([JSValue(undefinedInContext: self.context), resultSets])
        }
    }

}
