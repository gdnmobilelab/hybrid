//
//  CustomMigration.swift
//  hybrid
//
//  Created by alastair.coote on 07/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import FMDBMigrationManager
import FMDB

class CustomMigration : NSObject, FMDBMigrating {
    
    let sql:String
    let name:String
    let version:UInt64
    
    
    init(name: String, sql:String) {
        self.version = UInt64(name)!
        self.name = name
        self.sql = sql
        super.init()
    }
    
    func migrateDatabase(_ database: FMDatabase!) throws {
        database.executeStatements(self.sql)
    }
    
}
