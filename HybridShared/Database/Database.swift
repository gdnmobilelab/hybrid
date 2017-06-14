//
//  Database.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import HybridShared
import FMDB
import PromiseKit


class Database {
    
    static var dbQueue: FMDatabaseQueue = {
        let dbURL = SharedResources.fileSystemURL.appendingPathComponent("workers.sqlite")
        return FMDatabaseQueue(url: dbURL)
    }()
    
    static func inDatabase<T>(_ block: (FMDatabase) throws -> T) throws -> T {
        
        var err:Error?
        var result:T?
        
        Database.dbQueue.inDatabase { db in
            do {
                result = try block(db)
            } catch {
                err = error
            }
        }
        
        if err != nil {
            throw err!
        }
        
        return result!
    }
    
    static func inTransaction<T>(_ block: (FMDatabase) throws -> T) throws -> T {
        
        var err:Error?
        var result:T?
        
        Database.dbQueue.inTransaction { db, rollback in
            do {
                result = try block(db)
            } catch {
                err = error
                rollback.pointee = true
            }
        }
        
        if err != nil {
            throw err!
        }
        
        return result!
    }

    
}
