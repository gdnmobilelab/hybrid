//
//  Database.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import FMDB
import PromiseKit
import CleanroomLogger

public class Database {
    
    static var dbQueue: FMDatabaseQueue = {
        let dbURL = SharedResources.fileSystemURL.appendingPathComponent("app-data.sqlite")
        Log.info?.message("Setting up core database with path: " + dbURL.path)
        
        let db = FMDatabaseQueue(url: dbURL)
        
        do {
            try DatabaseMigration.check(dbQueue: db)
        } catch {
            
            // At some point we should do something other than fatalError here, but if the migration
            // failed then the DB is in an incorrect state for the app, so we shouldn't continue to do
            // anything.
            
            Log.error?.message("Database migration failed: " + String(describing: error))
            fatalError(String(describing: error))
        }
        return db
    }()
    
    public static func inDatabase<T>(_ block: (FMDatabase) throws -> T) throws -> T {
        
        var err:Error?
        var result:T?
        
        Database.dbQueue.inDatabase { db in
            do {
                result = try block(db)
                if db.hasOpenResultSets {
                    throw ErrorMessage("You still have a result set open at the end of your DB block.")
                }
            } catch {
                db.closeOpenResultSets()
                err = error
            }
        }
        
        if err != nil {
            throw err!
        }
        
        return result!
    }
    
    public static func inTransaction<T>(_ block: (FMDatabase) throws -> T) throws -> T {
        
        var err:Error?
        var result:T?
        
        Database.dbQueue.inTransaction { db, rollback in
            do {
                result = try block(db)
                if db.hasOpenResultSets {
                    throw ErrorMessage("You still have a result set open at the end of your DB block.")
                }
            } catch {
                err = error
                db.closeOpenResultSets()
                rollback.pointee = true
            }
        }
        
        if err != nil {
            throw err!
        }
        
        return result!
    }
    
    public static func existingTransactionOrNew<T>(_ transaction: FMDatabase?, _ block: (FMDatabase) throws -> T) throws -> T {
        
        if let transactionExists = transaction {
            return try block(transactionExists)
        }
        
        return try Database.inTransaction(block)
        
    }

    
}
