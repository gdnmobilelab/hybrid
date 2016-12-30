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
class ResultSetsStillOpenError : Error {}


/// Handler class for all of our database operations. A wrapper around FMDB: https://github.com/ccgus/fmdb
class Db {
    
    /// FMDB recommends using a database queue to ensure thread safety.
    fileprivate let dbQueue:FMDatabaseQueue!
    
    
    /// The base URL for our database storage - a directory named Databases in our shared file system.
    fileprivate static var databasesURL:URL {
        get {
            return SharedResources.fileSystemURL.appendingPathComponent("Databases", isDirectory: true)
        }
    }
    
    
    /// Return the full path for a database with the given name
    ///
    /// - Parameter dbFilename: The basename of the database - without any directory or file extension info
    /// - Returns: Full file URL for database path
    static func getFullPathForDB(_ dbFilename:String, inDirectory:String? = nil) throws -> URL {
        var url = Db.databasesURL
        
        if inDirectory != nil {
            url = url.appendingPathComponent(inDirectory!, isDirectory: true)
            
            if FileManager.default.fileExists(atPath: url.path) == false {
                try FileManager.default.createDirectory(atPath: url.path, withIntermediateDirectories: true, attributes: nil)
            }
            
        }
            
        return url.appendingPathComponent(dbFilename)
            .appendingPathExtension("sqlite")
    }
    
    
    /// Create a new instance of our DB wrapper. We mostly use mainDatabase, but site-specific WebSQL storage
    /// requires us to create different files.
    ///
    /// - Parameter dbFilename: The name of the database we wish to create
    /// - Throws: If for some reason we were not able to create the Database directory, this will fail.
    init(dbFilename:String) throws {
        
        let fm = FileManager.default
        if fm.fileExists(atPath: Db.databasesURL.path) == false {
            try fm.createDirectory(atPath: Db.databasesURL.path, withIntermediateDirectories: true, attributes: nil)
        }
        
        
        let dbURL = try Db.getFullPathForDB(dbFilename)
    
        log.debug("Creating database queue for: " + dbURL.path)
        
        self.dbQueue = FMDatabaseQueue(path: dbURL.path)!
        
    }
    
    
    /// Close the database queue
    func destroy() {
        dbQueue.close()
    }
    
    
    /// Run a series of database operations inside a transaction. Operations have to be synchronous.
    ///
    /// - Parameter toRun: A function using the FMDatabase instance passed to it
    /// - Throws: If any operation inside the function fails, or if the transaction commit fails, it will throw
    func inTransaction(_ toRun: @escaping (_:FMDatabase) throws -> Void) throws {
        
        var err:Error? = nil
        
        dbQueue.inTransaction() {
            db, rollback in
            
            do {
                try toRun(db!)
                if (db?.hasOpenResultSets())! {
                    throw ResultSetsStillOpenError() as Error
                }
            } catch {
                rollback?.pointee = true
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
    func inDatabase(_ toRun: @escaping (_:FMDatabase) throws -> Void) throws {
        
        var err:Error? = nil
        
        dbQueue.inDatabase() {
            db in
            
            do {
                try toRun(db!)
                if (db?.hasOpenResultSets())! {
                    throw ResultSetsStillOpenError() as Error
                }
            } catch {
                
                err = error
            }
        }
        
        if (err != nil ){
            throw err!
        }
        
    }

    fileprivate static var mainDB:Db?
    
    
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
    
    func migrateDatabase(_ database: FMDatabase!) throws {
        database.executeStatements(self.sql)
    }
    
}


/// Thin wrapper around FMDBMigrationManager (https://github.com/layerhq/FMDBMigrationManager) to ensure our
/// SQLite databases are at the latest migration on app startup
class DbMigrate {
    
    fileprivate static func addPreloadedWorkers(_ manager:FMDBMigrationManager, db:FMDatabase) throws {
        
        let plistPath = Util.appBundle().path(forResource: "workers", ofType: "plist", inDirectory: "preload-workers")
        
        if plistPath == nil {
            // no workers to preload
            return
        }
        
        var entries = NSArray(contentsOfFile: plistPath!) as! [AnyObject]

        // If we haven't run the first migration yet then we know we want to
        // add all of our bundled workers. Also the tables don't exist, so we
        // can't query them
        
        if manager.currentVersion >= 201606290 {
            
            let existingWorkers = try db.executeQuery("SELECT DISTINCT url, scope FROM service_workers WHERE install_state < ?", values: [ServiceWorkerInstallState.redundant.rawValue])
            
            while existingWorkers.next() {
                let workerURL = existingWorkers.string(forColumn: "url")
                let workerScope = existingWorkers.string(forColumn: "scope")
                
                let indexOfPreloadWorker = entries.index { obj in
                    
                    let url = obj["url"] as! String
                    let scope = obj["scope"] as! String
                    
                    return url == workerURL && scope == workerScope
                }
                
                if indexOfPreloadWorker != nil {
                    // We already have this worker installed and potentially more
                    // up to date than the bundled one. So remove it.
                    entries.remove(at: indexOfPreloadWorker!)
                }
                
            }
            
        }
        
        log.info(String(entries.count) + " bundled service workers to be installed...")
        
        for entry in entries {
            
            let file = entry["file"] as! String
            
            let sqlPath = Util.appBundle().path(forResource: "worker_" + file, ofType: "sql", inDirectory: "preload-workers")!
            
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
            
                try migrateManager.migrateDatabase(toVersion: UInt64.max, progress: nil)
                
                log.debug("Migrated. Database now at version " + String(migrateManager.currentVersion))
            }
        }
        
    }
}
