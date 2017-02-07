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

/// Thin wrapper around FMDBMigrationManager (https://github.com/layerhq/FMDBMigrationManager) to ensure our
/// SQLite databases are at the latest migration on app startup
class DbMigrate {
    
    fileprivate static func addPreloadedWorkers(_ manager:FMDBMigrationManager, db:FMDatabase) throws {
        
        let plistPath = SharedResources.appBundle.path(forResource: "workers", ofType: "plist", inDirectory: "preload-workers")
        
        if plistPath == nil {
            // no workers to preload
            return
        }
        
        var entries = NSArray(contentsOfFile: plistPath!) as! [AnyObject]
        
        // If we haven't run the first migration yet then we know we want to
        // add all of our bundled workers. Also the tables don't exist, so we
        // can't query them
        
        if manager.currentVersion >= 201606290 {

            throw ErrorMessage("Need to re-implement this")
            
//            let existingWorkers = try db.executeQuery("SELECT DISTINCT url, scope FROM service_workers WHERE install_state < ?", values: [ServiceWorkerInstallState.redundant.rawValue])
//            
//            while existingWorkers.next() {
//                let workerURL = existingWorkers.string(forColumn: "url")
//                let workerScope = existingWorkers.string(forColumn: "scope")
//                
//                let indexOfPreloadWorker = entries.index { obj in
//                    
//                    let url = obj["url"] as! String
//                    let scope = obj["scope"] as! String
//                    
//                    return url == workerURL && scope == workerScope
//                }
//                
//                if indexOfPreloadWorker != nil {
//                    // We already have this worker installed and potentially more
//                    // up to date than the bundled one. So remove it.
//                    entries.remove(at: indexOfPreloadWorker!)
//                }
//                
//            }
            
        }
        
        log.info(String(entries.count) + " bundled service workers to be installed...")
        
        for entry in entries {
            
            let file = entry["file"] as! String
            
            let sqlPath = SharedResources.appBundle.path(forResource: "worker_" + file, ofType: "sql", inDirectory: "preload-workers")!
            
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
            let migrateManager = FMDBMigrationManager(database: db, migrationsBundle: SharedResources.appBundle)!
            
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
