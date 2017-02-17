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
import PromiseKit


/// An error that is thrown when we complete an inDatabase or inTransaction call without closing the result
/// sets we create in that call. We need to ensure we do so to avoid leaks etc.
class ResultSetsStillOpenError : Error {}


/// Handler class for all of our database operations. A wrapper around FMDB: https://github.com/ccgus/fmdb
public class Db {
    
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
    public static func getFullPathForDB(_ dbFilename:String, inDirectory:String? = nil) throws -> URL {
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
    public func inTransaction(_ toRun: @escaping (_:FMDatabase) throws -> Void) throws {
        
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
    public func inDatabase(_ toRun: @escaping (_:FMDatabase) throws -> Void) throws {
        
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
    public static func createMainDatabase() throws {
        Db.mainDB = try Db(dbFilename: "db")
        try DbMigrate.migrate()
    }
    
    
    /// The DB instance that most of our operations (service worker, cache) go through.
    public static var mainDatabase:Db {
        get {
            return self.mainDB!
        }
    }
    
}


