//
//  SQLiteBlobWriteStream.swift
//  Shared
//
//  Created by alastair.coote on 20/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import SQLite3

public class SQLiteBlobWriteStream : SQLiteBlobStream {
    
    override var isWriteStream: Int32 {
        get {
            return 1
        }
    }
    
    func write(_ buffer: UnsafePointer<UInt8>, maxLength len: Int) -> Int {
     
        let bytesLeft = self.blobLength! - self.currentPosition!
        let lengthToWrite = min(Int32(len), bytesLeft)
        
        if sqlite3_blob_write(self.pointer!, buffer, lengthToWrite, self.currentPosition!) != SQLITE_OK {
            return -1
        }
        
        self.currentPosition = self.currentPosition! + lengthToWrite
        
        return Int(lengthToWrite)
    }
    
    var hasSpaceAvailable:Bool {
        get {
            return self.currentPosition! < self.blobLength!
        }
    }
    
}
