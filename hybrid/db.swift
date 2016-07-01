//
//  db.swift
//  hybrid
//
//  Created by alastair.coote on 15/06/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import FMDB
import JavaScriptCore
import FMDBMigrationManager
import PromiseKit

class Db {
    static let dbQueue = FMDatabaseQueue(path: NSHomeDirectory() + "/Library/db.sqlite")!
    //    static let dbInstance = FMDatabase(path: NSHomeDirectory() + "/Library/db.sqlite")
    
    
    
    static func query(queryText: String, values: [AnyObject]) {
        
    }
    
    static func TransactionPromise(toRun: (db:FMDatabase) -> Promise<AnyObject>) -> Promise<AnyObject> {
        
        return Promise { fulfill, reject in
            dbQueue.inTransaction() {
                db, rollback in
                
                toRun(db: db)
                .then { returnedPromise in
                    fulfill(returnedPromise)
                }
                .error { error in
                    rollback.initialize(true)
                    reject(error)
                }
            }
        }
        
        
    }
    
    static func inTransaction(toRun: (db:FMDatabase) throws -> Void) throws {
        
        var err:ErrorType? = nil
        
        dbQueue.inTransaction() {
            db, rollback in
            
            do {
                try toRun(db: db!)
            } catch {
                
                rollback.initialize(true)
                err = error
            }
        }
        
        if (err != nil ){
            throw err!
        }
        
    }
    
    static func migrate() throws {
        
        try self.inTransaction { (db) in
            let migrateManager = FMDBMigrationManager(database: db, migrationsBundle: NSBundle.mainBundle())!
            
            if migrateManager.hasMigrationsTable == false {
                try migrateManager.createMigrationsTable()
            }
            
            log.debug("Database currently at migration " + String(migrateManager.currentVersion) + ", " + String(migrateManager.pendingVersions.count) + " migrations pending.")
            
            if (migrateManager.pendingVersions.count > 0) {
                try migrateManager.migrateDatabaseToVersion(UInt64.max, progress: nil)
            }
            
        }
        
    }
}
