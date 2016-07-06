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

class DbTransactionPromise<T>: Promise<T> {
    
    typealias DBRun = (db:FMDatabase) throws -> Promise<T>
    
    init(toRun: DBRun) {
        super.init(resolvers: { fulfill, reject in
            Db.dbQueue.inTransaction() {
                db, rollback in
                
                do {
                    // It can fail synchronously
                    try toRun(db: db)
                        
                        .then { returnedPromise in
                            
                            fulfill(returnedPromise)
                        }
                        .error { error in
                            // Or asynchronously
                            db.rollback()
                            rollback.initialize(true)
                            reject(error)
                    }
                } catch {
                    db.rollback()
                    rollback.initialize(true)
   
                    reject(error)
                }
            }
        })
    }
}


class Db {
    static let dbQueue = FMDatabaseQueue(path: NSHomeDirectory() + "/Library/db.sqlite")!
    //    static let dbInstance = FMDatabase(path: NSHomeDirectory() + "/Library/db.sqlite")
    
    
    
    static func query(queryText: String, values: [AnyObject]) {
        
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
            log.debug("Database path: " + dbQueue.path)
            log.debug("Database currently at migration " + String(migrateManager.currentVersion) + ", " + String(migrateManager.pendingVersions.count) + " migrations pending.")
            
//            if (migrateManager.pendingVersions.count > 0) {
                try migrateManager.migrateDatabaseToVersion(UInt64.max, progress: nil)
                
//            }
            
        }
        
    }
}
