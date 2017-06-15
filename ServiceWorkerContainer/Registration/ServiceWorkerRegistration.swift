//
//  ServiceWorkerRegistration.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import PromiseKit
import HybridShared
import ServiceWorker
import FMDB

class ServiceWorkerRegistration {
    
    let scope: URL
    var active: ServiceWorker?
    var waiting: ServiceWorker?
    var installing: ServiceWorker?
    var redundant: ServiceWorker?
    
    init(scope: URL) {
        self.scope = scope
    }
    
    func update(withURL:URL? = nil) throws {
        
        // We can try to update with a new URL if we want - it will replace any existing worker.
        var workerURL = withURL
        var checkHeadersOf:ServiceWorker? = nil
        if workerURL == nil {
            
            // If we haven't provided a URL, we just base this on the URL of the current worker. I'm not sure
            // of exactly how the logic should work here (do waiting workers count?) but we'll use both for now.
            // Ignoring installing workers because they're updating a worker that's currently installing makes
            // no sense.
            
            if self.active != nil {
                workerURL = self.active!.url
                checkHeadersOf = self.active
            } else if self.waiting != nil {
                workerURL = self.waiting!.url
                checkHeadersOf = self.waiting
            }
        }
        
        if (workerURL == nil) {
            throw ErrorMessage("No URL provided for update, and no existing worker could be used to check URL")
        }
        
        // We attempt to use Last-Modified and ETag headers to minimise the amount of code we're downloading
        // as part of this update process. If we are updating an existing worker, we grab the headers seen at
        // the time.
        var compareHeaders:FetchHeaders? = nil
        if let workerToCheck = checkHeadersOf {
            
        }
        
    }
    
    static public func get(scope:URL, inTransaction: FMDatabase? = nil) throws -> ServiceWorkerRegistration? {
        
        return try Database.existingTransactionOrNew(inTransaction, { db -> ServiceWorkerRegistration? in
            
            let resultSet = try db.executeQuery("SELECT * FROM registrations WHERE scope = ?", values: [scope.absoluteString])
            
            if resultSet.next() == false {
                return nil
            }
            
            let reg = ServiceWorkerRegistration(scope: scope)
            
            // If we have a registration, we need to check if any existing workers are attached to it.
            // To do that, we assemble an array of worker IDs we'll query, as well as another array
            // that'll let us map the workers back to the appropriate registration property.
            
            struct ToFetch {
                let worker_id:String;
                let status:String;
            }
            
            var toFetch: [ToFetch] = []
            
            ["active", "waiting", "installing", "redundant"].forEach { status in
                
                if let val = resultSet.string(forColumn: status) {
                    toFetch.append(ToFetch(worker_id: val, status: status))
                }
                
            }
            
            resultSet.close()
            
            if toFetch.count == 0 {
                return reg
            }
            
            let params = toFetch.map({ id in return "?"}).joined(separator: ",")
            
            let workerResults = try db.executeQuery("SELECT worker_id, url FROM workers WHERE worker_id in (\(params))", values: toFetch.map { $0.worker_id })
            
            while workerResults.next() {
                
                let url = workerResults.string(forColumn: "url")!
                let id = workerResults.string(forColumn: "worker_id")!
                
                let worker = ServiceWorker(id: id, url: URL(string: url)!)
                
                // SQLite doesn't guarantee that the workers will be returned in the order we requested them
                // so, we need to double-check, go back to our fetch map and get the appropriate status.
                let status = toFetch.first(where: { $0.worker_id == id})!.status
                
                switch status {
                    case "active":
                        reg.active = worker
                    case "installing":
                        reg.installing = worker
                    case "waiting":
                        reg.waiting = worker
                    case "redundant":
                        reg.redundant = worker
                    default:
                        throw ErrorMessage("Invalid property returned from database")
                }
            }
            
            workerResults.close()
            
            return reg
            
        })
        
    }
    
    static public func create(scope:URL, inTransaction: FMDatabase? = nil) throws -> ServiceWorkerRegistration {
        
        return try Database.existingTransactionOrNew(inTransaction, { db -> ServiceWorkerRegistration in
            
            try db.executeUpdate("INSERT INTO registrations (scope) VALUES (?)", values: [scope.absoluteString])
            return ServiceWorkerRegistration(scope: scope)
            
        })
        
    }
    
}

