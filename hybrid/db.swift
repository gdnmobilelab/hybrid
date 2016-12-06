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
    func inTransaction(toRun: (_:FMDatabase) throws -> Void) throws {
        
        var err:ErrorType? = nil
        
        dbQueue.inTransaction() {
            db, rollback in
            
            do {
                try toRun(db!)
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
    func inDatabase(toRun: (_:FMDatabase) throws -> Void) throws {
        
        var err:ErrorType? = nil
        
        dbQueue.inDatabase() {
            db in
            
            do {
                try toRun(db!)
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
    
    func migrateDatabase(database: FMDatabase!) throws {
        
        try database.executeStatements(self.sql)
    }
    
}


/// Thin wrapper around FMDBMigrationManager (https://github.com/layerhq/FMDBMigrationManager) to ensure our
/// SQLite databases are at the latest migration on app startup
class DbMigrate {
    
    private static func addPreloadedWorkers(manager:FMDBMigrationManager, db:FMDatabase) throws {
        
        let plistPath = Util.appBundle().pathForResource("workers", ofType: "plist", inDirectory: "preload-workers")
        
        if plistPath == nil {
            // no workers to preload
            return
        }
        
        var entries = NSArray(contentsOfFile: plistPath!) as! [AnyObject]

        // If we haven't run the first migration yet then we know we want to
        // add all of our bundled workers. Also the tables don't exist, so we
        // can't query them
        
        if manager.currentVersion >= 201606290 {
            
            let existingWorkers = try db.executeQuery("SELECT DISTINCT url, scope FROM service_workers WHERE install_state < ?", values: [ServiceWorkerInstallState.Redundant.rawValue])
            
            while existingWorkers.next() {
                let workerURL = existingWorkers.stringForColumn("url")
                let workerScope = existingWorkers.stringForColumn("scope")
                
                let indexOfPreloadWorker = entries.indexOf { obj in
                    return obj["url"] as! String == workerURL && obj["scope"] as! String == workerScope
                }
                
                if indexOfPreloadWorker != nil {
                    // We already have this worker installed and potentially more
                    // up to date than the bundled one. So remove it.
                    entries.removeAtIndex(indexOfPreloadWorker!)
                }
                
            }
            
        }
        
        log.info(String(entries.count) + " bundled service workers to be installed...")
        
        for entry in entries {
            
            let file = entry["file"] as! String
            
            let sqlPath = Util.appBundle().pathForResource("worker_" + file, ofType: "sql", inDirectory: "preload-workers")!
            
            let sql = try String(contentsOfFile: sqlPath)

            
            let migrate = CustomMigration(name: file, sql: sql)
            
            manager.addMigration(migrate)
        }
        
    }
    
    
    /// Called in the app delegate so that all migrations are completed before any code attempts to use the database
    ///
    /// - Throws: If a migration fails. App will fail to launch, as the DB will be considered to be in an invalid state.
    static func migrate() throws {
        
        try Db.mainDatabase.inDatabase { (db) in
            let migrateManager = FMDBMigrationManager(database: db, migrationsBundle: Util.appBundle())!
            
            // Has to be disabled, or the manager tries to add the static CustomMigration to migrate list
            migrateManager.dynamicMigrationsEnabled = false
            
            try addPreloadedWorkers(migrateManager, db: db)
            
            if migrateManager.hasMigrationsTable == false {
                try migrateManager.createMigrationsTable()
            }
            log.debug("Database currently at migration " + String(migrateManager.currentVersion) + ", " + String(migrateManager.pendingVersions.count) + " migrations pending.")
            
            if migrateManager.pendingVersions.count > 0 {
            
                try migrateManager.migrateDatabaseToVersion(UInt64.max, progress: nil)
                
                log.debug("Migrated. Database now at version " + String(migrateManager.currentVersion))
            }
        }
        
    }
}
