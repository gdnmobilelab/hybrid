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
import HybridShared

@objc protocol WebSQLDatabaseCreatorExports : JSExport {
    func createDB(_ name:String) -> [AnyObject]
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
            regex = try NSRegularExpression(pattern: "([^A-Za-z0-9]*)", options: .caseInsensitive)
        } catch {
            log.error("Regex could not be created. This should never happen.")
        }
        
        regex!.replaceMatches(in: sanitisedOrigin, options: [], range: NSRange(0..<origin.utf16.count), withTemplate: "")
        
        self.sanitisedOrigin = sanitisedOrigin as String
        
        super.init()
        
    }
    
    
    /// Create our WebSQL database
    ///
    /// - Parameter name: Name of the database. Is used as the DB filename
    /// - Returns: An two-item array. First item is an error, if it exists. Second is the DB instance, if there is no error.
    func createDB(_ name:String) -> [AnyObject] {
        
        // JSExport doesn't like functions that throw, so we're passing back an array
        // of the error and DB
        
        do {
            let dbPath = try Db.getFullPathForDB(name, inDirectory: self.sanitisedOrigin)
            let db = WebSQLDatabase(dbPath: dbPath.path, context: self.context)
            return [JSValue(nullIn:self.context), db]
        } catch {
            return [JSValue(newErrorFromMessage: String(describing: error), in: self.context)]
        }
    }
}
