//
//  WebSQLResultSet.swift
//  hybrid
//
//  Created by alastair.coote on 07/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import FMDB
import JavaScriptCore

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
