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


/// An error that is thrown when we complete an inDatabase or inTransaction call without closing the result
/// sets we create in that call. We need to ensure we do so to avoid leaks etc.
class ResultSetsStillOpenError : ErrorType {}


/// Handler class for all of our database operations. A wrapper around FMDB: https://github.com/ccgus/fmdb
class Db {
    
    /// FMDB recommends using a database queue to ensure thread safety.
    private let dbQueue:FMDatabaseQueue!
    
    
    /// The base URL for our database storage - a directory named Databases in our shared file system.
    private static var databasesURL:NSURL {
        get {
            return SharedResources.fileSystemURL.URLByAppendingPathComponent("Databases", isDirectory: true)!
        }
    }
    
    
    /// Return the full path for a database with the given name
    ///
    /// - Parameter dbFilename: The basename of the database - without any directory or file extension info
    /// - Returns: Full file URL for database path
    static func getFullPathForDB(dbFilename:String, inDirectory:String? = nil) throws -> NSURL {
        var url = Db.databasesURL
        
        if inDirectory != nil {
            url = url.URLByAppendingPathComponent(inDirectory!, isDirectory: true)!
            
            if NSFileManager.defaultManager().fileExistsAtPath(url.path!) == false {
                try NSFileManager.defaultManager().createDirectoryAtPath(url.path!, withIntermediateDirectories: true, attributes: nil)
            }
            
        }
            
        return url.URLByAppendingPathComponent(dbFilename)!
            .URLByAppendingPathExtension("sqlite")!
    }
    
    
    /// Create a new instance of our DB wrapper. We mostly use mainDatabase, but site-specific WebSQL storage
    /// requires us to create different files.
    ///
    /// - Parameter dbFilename: The name of the database we wish to create
    /// - Throws: If for some reason we were not able to create the Database directory, this will fail.
    init(dbFilename:String) throws {
        
        let fm = NSFileManager.defaultManager()
        if fm.fileExistsAtPath(Db.databasesURL.path!) == false {
            try fm.createDirectoryAtPath(Db.databasesURL.path!, withIntermediateDirectories: true, attributes: nil)
        }
        
        
        let dbURL = try Db.getFullPathForDB(dbFilename)
    
        log.debug("Creating database queue for: " + dbURL.path!)
        
        self.dbQueue = FMDatabaseQueue(path: dbURL.path!)!
        
    }
    
    
    /// Close the database queue
    func destroy() {
        dbQueue.close()
    }
    
    
    /// Run a series of database operations inside a transaction. Operations have to be synchronous.
    ///
    /// - Parameter toRun: A function using the FMDatabase instance passed to it
    /// - Throws: If any operation inside the function fails, or if the transaction commit fails, it will throw
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
    
    
    /// Run a series of database operations outside of a transaction. To be used for SELECT statements, where
    /// transactions don't matter as much.
    ///
    /// - Parameter toRun: A function using the FMDatabase instance passed to it
    /// - Throws: If any operation inside the function fails, it will throw
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
    
    
    /// Called in the AppDelegate to ensure the mainDatabase is available to all code from app startup
    ///
    /// - Throws: If we can't create the database, it'll throw, and the app will not launch successfully
    static func createMainDatabase() throws {
        Db.mainDB = try Db(dbFilename: "db")
    }
    
    
    /// The DB instance that most of our operations (service worker, cache) go through.
    static var mainDatabase:Db {
        get {
            return self.mainDB!
        }
    }
    
}


/// Thin wrapper around FMDBMigrationManager (https://github.com/layerhq/FMDBMigrationManager) to ensure our
/// SQLite databases are at the latest migration on app startup
class DbMigrate {
    
    
    /// Called in the app delegate so that all migrations are completed before any code attempts to use the database
    ///
    /// - Throws: If a migration fails. App will fail to launch, as the DB will be considered to be in an invalid state.
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
