//
//  SQLiteBlobInputStream.swift
//  Shared
//
//  Created by alastair.coote on 19/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import SQLite3

public class SQLiteBlobInputStream : InputStream {
    
    let table:String;
    let column:String;
    let row:Int64
    let dbPointer:OpaquePointer
    
    var pointer: OpaquePointer?
    var blobLength: Int32?
    var currentReadPosition: Int32?
    
    init(_ dbPointer: OpaquePointer, table: String, column:String, row: Int64) {
        
        self.dbPointer = dbPointer
        self.table = table
        self.column = column
        self.row = row
        
        // don't get why we need to specify a file here
        super.init(data: Data(capacity: 0))
    }
    
    public override func open() {
        sqlite3_blob_open(self.dbPointer, "main", self.table, self.column, self.row, 0, &self.pointer)
        self.blobLength = sqlite3_blob_bytes(self.pointer)
        self.currentReadPosition = 0
    }
    
    public override func read(_ buffer: UnsafeMutablePointer<UInt8>, maxLength len: Int) -> Int {
        
        let bytesLeft = self.blobLength! - self.currentReadPosition!
        
        let lengthToRead = min(Int32(len), bytesLeft)
        
        if sqlite3_blob_read(self.pointer!, buffer, lengthToRead, self.currentReadPosition!) != SQLITE_OK {
            NSLog("What do we do here?")
        }
        self.currentReadPosition = self.currentReadPosition! + lengthToRead
        return Int(lengthToRead)
        
    }
}
