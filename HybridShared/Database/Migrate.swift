//
//  Migrate.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

class DatabaseMigration {
    
    static func check() throws {
        
        try Database.inTransaction { db in
            
            let tableCheck = """
                CREATE TABLE IF NOT EXISTS _migrations (
                     "identifier" text NOT NULL,
                     "value" integer NOT NULL,
                    PRIMARY KEY("identifier")
                );

                INSERT OR IGNORE INTO _migrations (identifier, value) VALUES ('currentVersion', 0);
            """
            
            if db.executeStatements(tableCheck) == false {
                throw DatabaseErrors.MigrationInitFailed
            }
            let migrationFiles = Bundle(for: DatabaseMigration.self).paths(forResourcesOfType: "sql", inDirectory: "DBMigrations")
            
            NSLog("woah")
            
            
        }
        
        
    }
    
    
}
