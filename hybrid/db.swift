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

//class DbTransactionPromise<T>: Promise<T> {
//    
//    typealias DBRun = (db:FMDatabase) throws -> Promise<T>
//    
//    init(toRun: DBRun) {
//        super.init(resolvers: { fulfill, reject in
//            Db.mainDatabase.dbQueue.inTransaction() {
//                db, rollback in
//                
//                do {
//                    // It can fail synchronously
//                    try toRun(db: db)
//                        
//                        .then { returnedPromise -> Void in
//
//                            fulfill(returnedPromise)
//                        }
//                        .error { error in
//                            // Or asynchronously
//                            //db.rollback()
//                            rollback.initialize(true)
//                            rollback.memory = true
//                            reject(error)
//                    }
//                } catch {
//                   // db.rollback()
//                    rollback.initialize(true)
//                    rollback.memory = true
//                    reject(error)
//                }
//            }
//        })
//    }
//}

class ResultSetsStillOpenError : ErrorType {}

class Db {
    
    let dbQueue:FMDatabaseQueue!
    
    private static var databasesURL:NSURL {
        get {
            return Fs.sharedStoreURL.URLByAppendingPathComponent("Databases", isDirectory: true)!
        }
    }
    
    static func getFullPathForDB(dbFilename:String) -> NSURL {
        return Db.databasesURL
            .URLByAppendingPathComponent(dbFilename)!
            .URLByAppendingPathExtension("sqlite")!
    }
    
    init(dbFilename:String) throws {
        
        try Db.createDirectoryFor(Db.databasesURL)
        
        let dbURL = Db.getFullPathForDB(dbFilename)
    
        log.debug("Creating database queue for: " + dbURL.path!)
        
        self.dbQueue = FMDatabaseQueue(path: dbURL.path!)!
        
    }
    
    static func getFullDatabasePath(dbDir:String, dbFilename: String) throws -> String {
        
        let dbDirURL = Db.databasesURL
            .URLByAppendingPathComponent(dbDir, isDirectory: true)!
        
        try Db.createDirectoryFor(dbDirURL)
        
        return dbDirURL
            .URLByAppendingPathComponent(dbFilename)!
            .URLByAppendingPathExtension("sqlite")!
            .path!
    }
    
    static private func createDirectoryFor(url:NSURL) throws {
        let fm = NSFileManager.defaultManager()
        if fm.fileExistsAtPath(url.path!) == false {
            try fm.createDirectoryAtPath(url.path!, withIntermediateDirectories: true, attributes: nil)
        }
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
                if db.hasOpenResultSets() {
                    throw ResultSetsStillOpenError()
                }
            } catch {
                rollback.memory = true
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
                if db.hasOpenResultSets() {
                    throw ResultSetsStillOpenError()
                }
            } catch {
                
                err = error
            }
        }
        
        if (err != nil ){
            throw err!
        }
        
    }

    private static var mainDB:Db?
    
    static func createMainDatabase() throws {
        Db.mainDB = try Db(dbFilename: "db")
    }
    
    static var mainDatabase:Db {
        get {
            return self.mainDB!
        }
    }
    
}

class DbMigrate {
    static func migrate() throws {
        
        try Db.mainDatabase.inDatabase { (db) in
            let migrateManager = FMDBMigrationManager(database: db, migrationsBundle: NSBundle.mainBundle())!
            
            if migrateManager.hasMigrationsTable == false {
                try migrateManager.createMigrationsTable()
            }
            log.debug("Database currently at migration " + String(migrateManager.currentVersion) + ", " + String(migrateManager.pendingVersions.count) + " migrations pending.")
            
            try migrateManager.migrateDatabaseToVersion(UInt64.max, progress: nil)
            
        }
        
    }
}
