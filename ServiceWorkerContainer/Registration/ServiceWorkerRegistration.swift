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
import Shared

class ServiceWorkerRegistration : ServiceWorkerRegistrationProtocol {
    
    func showNotification(title: String) {
        
    }
 
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
            // Ignoring installing workers because updating a worker that's currently installing makes
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
    
    static public func get(scope:URL) throws -> ServiceWorkerRegistration? {
        
        return try CoreDatabase.inConnection() { connection in
            
            return try connection.select(sql: "SELECT * FROM registrations WHERE scope = ?", values: [scope.absoluteString]) { rs -> ServiceWorkerRegistration? in
                
                if rs.next() == false {
                    // If we don't already have a registration, return nil (get() doesn't create one)
                    return nil
                }
                
                let reg = ServiceWorkerRegistration(scope: scope)
                
                let activeId = try rs.string("active")
                let waitingId = try rs.string("waiting")
                let installingId = try rs.string("installing")
                let redundantId = try rs.string("redundant")
                
                // Now go back to the DB and fetch the worker details for each registration slot
                
                try connection.select(sql: """
                    SELECT worker_id, url
                    FROM workers as w
                    INNER JOIN registrations as r ON
                        w.worker_id = r.active OR
                        w.worker_id = r.waiting OR
                        w.worker_id = r.installing OR
                        w.worker_id = r.redundant
                    WHERE
                        r.scope = ?
                """, values: [scope.absoluteString]) { workerResults in
                    
                    while workerResults.next() {
                        
                        let workerId = try workerResults.string("worker_id")!
                        let worker = ServiceWorker(id: workerId, url: try workerResults.url("url")!, registration: reg)
                        
                        if workerId == activeId {
                            reg.active = worker
                        } else if workerId == waitingId {
                            reg.waiting = worker
                        } else if workerId == installingId {
                            reg.installing = worker
                        } else if workerId == redundantId {
                            reg.redundant = worker
                        }
                        
                    }
                }
                
                return reg
            }
            
        }
        
        
    }
    
    static public func create(scope:URL) throws -> ServiceWorkerRegistration {
        
        return try CoreDatabase.inConnection() { connection in
            _ = try connection.insert(sql: "INSERT INTO registrations (scope) VALUES (?)", values: [scope])
            return ServiceWorkerRegistration(scope: scope)
        }
        
    }
    
}



