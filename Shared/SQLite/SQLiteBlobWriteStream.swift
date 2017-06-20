//
//  SQLiteBlobWriteStream.swift
//  Shared
//
//  Created by alastair.coote on 20/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import SQLite3


class SqliteBlobWriteStream : OutputStream {
    
    let table:String;
    let column:String;
    let row:Int64
    fileprivate let dbPointer:OpaquePointer
    var isOpen:Bool = false
    
    fileprivate var pointer: OpaquePointer?
    fileprivate var blobLength: Int32?
    fileprivate var currentReadPosition: Int32?
    
    init(_ dbPointer: OpaquePointer, table: String, column:String, row: Int64) {
        self.dbPointer = dbPointer
        self.table = table
        self.column = column
        self.row = row
        super.init(toMemory: ())
    }
    
    public override func open() {
        sqlite3_blob_open(self.dbPointer, "main", self.table, self.column, self.row, 1, &self.pointer)
    }
}
