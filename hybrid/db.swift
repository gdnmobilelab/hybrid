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
            Db.mainDatabase.dbQueue.inTransaction() {
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
    
    let dbQueue:FMDatabaseQueue!
    
    init(dbFilename:String) {
        let dbPath = NSHomeDirectory() + "/Library/" + dbFilename + ".sqlite"
        
        log.debug("Creating database queue for: " + dbPath)
        
        self.dbQueue = FMDatabaseQueue(path: dbPath)!
    }
    
    init(dbDir:String, dbFilename: String) throws {
        
        let fullPath = try Db.getFullDatabasePath(dbDir, dbFilename: dbFilename)
        
        log.debug("Creating database queue for: " + fullPath)
        
        self.dbQueue = FMDatabaseQueue(path: fullPath)!
        
    }
    
    static func getFullDatabasePath(dbDir:String, dbFilename: String) throws -> String {
        let fullDirPath = NSHomeDirectory() + "/Library/" + dbDir
        
        let fm = NSFileManager.defaultManager()
        if fm.fileExistsAtPath(fullDirPath) == false {
            try fm.createDirectoryAtPath(fullDirPath, withIntermediateDirectories: true, attributes: nil)
        }
        
        return fullDirPath + "/" + dbFilename
    }
    
    func destroy() {
        dbQueue.close()
    }
    
    func inTransaction(toRun: (db:FMDatabase) throws -> Void) throws {
        
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
    
    func inDatabase(toRun: (db:FMDatabase) throws -> Void) throws {
        
        var err:ErrorType? = nil
        
        dbQueue.inDatabase() {
            db in
            
            do {
                try toRun(db: db!)
            } catch {
                
                err = error
            }
        }
        
        if (err != nil ){
            throw err!
        }
        
    }
    
    static let mainDatabase = Db(dbFilename: "db")
}

class DbMigrate {
    static func migrate() throws {
        
        try Db.mainDatabase.inTransaction { (db) in
            let migrateManager = FMDBMigrationManager(database: db, migrationsBundle: NSBundle.mainBundle())!
            
            if migrateManager.hasMigrationsTable == false {
                try migrateManager.createMigrationsTable()
            }
            log.debug("Database currently at migration " + String(migrateManager.currentVersion) + ", " + String(migrateManager.pendingVersions.count) + " migrations pending.")
            
            try migrateManager.migrateDatabaseToVersion(UInt64.max, progress: nil)
            
        }
        
    }
}
