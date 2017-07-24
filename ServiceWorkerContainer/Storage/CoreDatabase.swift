//
//  CoreDatabase.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 24/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared

class CoreDatabase {
    
    public static let dbPath = SharedResources.appGroupStorage.appendingPathComponent("core.db")
    
    /// The migrations only change with a new version of the app, so as long as we've
    /// checked for migrations once per app launch, we're OK to not check again
    static var dbMigrationCheckDone = false
    
    public static func inConnection<T>(_ cb: (SQLiteConnection) throws -> T) throws -> T {
        
        if self.dbMigrationCheckDone == false {
            
            Log.info?("Migration check for core DB not done yet, doing it now...")
            
            let migrations = URL(fileURLWithPath: Bundle(for: CoreDatabase.self).bundlePath, isDirectory: true)
                .appendingPathComponent("DatabaseMigrations", isDirectory: true)
                .appendingPathComponent("core", isDirectory: true)

            // This might be the first time it's being run, in which case, we need to ensure we have the
            // directory structure ready.
            try FileManager.default.createDirectory(at: self.dbPath.deletingLastPathComponent(), withIntermediateDirectories: true, attributes: nil)
            
            _ = try DatabaseMigration.check(dbPath: self.dbPath, migrationsPath: migrations)
            self.dbMigrationCheckDone = true
            
        }
        
        return try SQLiteConnection.inConnection(self.dbPath, cb)
    }
    
}
