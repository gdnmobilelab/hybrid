//
//  Migrate.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import FMDB
import CleanroomLogger
import Shared

fileprivate struct MigrationAndVersion {
    let fileName:URL
    let version:Int
}

class DatabaseMigration {
    
    fileprivate static func ensureMigrationTableCreated(_ db:FMDatabase) throws {
        let tableCheck = """
                CREATE TABLE IF NOT EXISTS _migrations (
                     "identifier" text NOT NULL,
                     "value" integer NOT NULL,
                    PRIMARY KEY("identifier")
                );

                INSERT OR IGNORE INTO _migrations (identifier, value) VALUES ('currentVersion', 0);
            """
        
        if db.executeStatements(tableCheck) == false {
            throw ErrorMessage("Could not create or check initial database migration table.")
        }
    }
    
    fileprivate static func getCurrentMigrationVersion(_ db:FMDatabase) throws -> Int {
        
        let resultSet = try db.executeQuery("SELECT value FROM _migrations WHERE identifier = 'currentVersion'", values: nil)
        
        if !resultSet.next() {
            throw ErrorMessage("Unable to retreive current database migration version")
        }
        
        let version = Int(resultSet.int(forColumn: "value"))
        
        return version
        
    }
    
    public static func check(dbQueue:FMDatabaseQueue) throws {
        
        var err:Error? = nil
        
        dbQueue.inTransaction { db, rollback in
            do {
                try self.ensureMigrationTableCreated(db)
                
                let currentVersion = try self.getCurrentMigrationVersion(db)
                
                // Grab all the migration files currently in our bundle.
                let migrationFiles = Bundle(for: DatabaseMigration.self).paths(forResourcesOfType: "sql", inDirectory: "DBMigrations")
                    .map { file -> MigrationAndVersion in
                        
                        // Extract the version number (the number before the _ in the file)
                        let url = URL(fileURLWithPath: file)
                        let idx = Int(url.deletingPathExtension().lastPathComponent.components(separatedBy: "_")[0])!
                        
                        return MigrationAndVersion(fileName: url, version: idx)
                        
                     }
                    // Remove any migrations we've already completed
                    .filter { $0.version > currentVersion }
                    // Sort them by version, so they execute in order
                    .sorted(by: { $1.version > $0.version })
                
                if migrationFiles.count == 0 {
                    Log.debug?.message("No pending migration files found")
                    return
                }
                
                for migration in migrationFiles {
                    
                    Log.info?.message("Processing migration file: " + migration.fileName.lastPathComponent)
                    let sql = try String(contentsOfFile: migration.fileName.path)
                    
                    if db.executeStatements(sql) == false {
                        throw ErrorMessage("Error when attempting migration:" + migration.fileName.absoluteString)
                    }
                    
                    
                }
                
                try db.executeUpdate("UPDATE _migrations SET value = ? WHERE identifier = 'currentVersion'", values: [migrationFiles.last!.version])
                
            } catch {
                rollback.pointee = true
                err = error
            }
        }
        
        if err != nil {
            throw err!
        }
        
        
    }
    
    
}
