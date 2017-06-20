//
//  SQLiteBlobInputStream.swift
//  Shared
//
//  Created by alastair.coote on 19/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import SQLite3

public class SQLiteBlobReadStream : SQLiteBlobStream {
    
    public var hasBytesAvailable: Bool {
        get {
            return self.currentPosition! < self.blobLength!
        }
    }
    
    public func getBuffer(_ buffer: UnsafeMutablePointer<UnsafeMutablePointer<UInt8>?>, length len: UnsafeMutablePointer<Int>) -> Bool {
        return false
    }
    
    public func read(_ buffer: UnsafeMutablePointer<UInt8>, maxLength len: Int) -> Int {
        
        let bytesLeft = self.blobLength! - self.currentPosition!
        
        let lengthToRead = min(Int32(len), bytesLeft)
        
        if sqlite3_blob_read(self.pointer!, buffer, lengthToRead, self.currentPosition!) != SQLITE_OK {
            return -1
        }
        self.currentPosition = self.currentPosition! + lengthToRead
        return Int(lengthToRead)
        
    }
}
