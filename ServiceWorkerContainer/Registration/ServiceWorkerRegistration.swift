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
    
    typealias RegisterCallback = (Error?, Bool?) -> Void
 
    let scope: URL
    var active: ServiceWorker?
    var waiting: ServiceWorker?
    var installing: ServiceWorker?
    var redundant: ServiceWorker?
    
    fileprivate init(scope: URL) {
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
    
    func register(_ workerURL: URL, _ cb: @escaping RegisterCallback) {
        
        let req = FetchRequest(url: workerURL)
        
        FetchOperation.fetch(req) { err, res in
            
            if err != nil {
                cb(err!, nil)
                return
            }
            
            if res!.ok == false {
                cb(ErrorMessage("Did not receive a valid response"), nil)
                return
            }
            
            self.processHTTPResult(res!, cb)
            
        }
        
        
    }
    
    func processHTTPResult(_ res: FetchResponseProtocol, _ cb: @escaping RegisterCallback) {
        do {
            var length:Int64 = -1
            
            if let lengthHeader = res.headers.get("Content-Length") {
                length = Int64(lengthHeader)!
            } else {
                throw ErrorMessage("Responses must send a Content-Length header")
            }
            
            try CoreDatabase.inConnection() { db in
                
                // first we create the row we will later stream into
                let newWorkerID = UUID().uuidString
                let rowID = try db.insert(sql: """
                            INSERT INTO workers
                                (worker_id, url, headers, content, install_state, scope)
                            VALUES
                                (?,?,?,zeroblob(?),?,?)
                        """, values: [
                            newWorkerID,
                            res.url,
                            try res.headers.toJSON(),
                            length,
                            ServiceWorkerInstallState.downloading.rawValue,
                            self.scope
                    ])
                
                let writeStream = db.openBlobWriteStream(table: "workers", column: "content", row: rowID)
                
                let reader = try res.getReader()
                writeStream.open()
                self.streamToDB(stream: reader, writer: writeStream) {
                    do {
                        let worker = try WorkerInstances.get(id: newWorkerID)
                        self.installWorker(worker: worker, cb: cb)
                    } catch {
                        cb(error, nil)
                    }
                }
            }
        } catch {
            cb(error, nil)
        }
    }
    
    fileprivate func streamToDB(stream: ReadableStream, writer: SQLiteBlobWriteStream, _ cb: @escaping () -> Void) {
        stream.read { result in
            if result.done {
                writer.close()
                cb()
            } else {
                _ = writer.write(result.value!)
                self.streamToDB(stream: stream, writer: writer, cb)
            }
        }
    }
    
    fileprivate func installWorker(worker:ServiceWorker, cb: @escaping RegisterCallback) {
        
        let ev = ExtendableEvent(type: "install")
        
        do {
            try self.updateWorkerStatus(worker: worker, newState: .installing)
            try worker.dispatchEvent(ev)
        } catch {
            do {
                try self.updateWorkerStatus(worker: worker, newState: .redundant)
            } catch {
                Log.error?("Could not update broken worker to redundant status")
            }
            cb(error, nil)
            return
        }
        
        
        ev.resolve { err in
            
            var newState: ServiceWorkerInstallState = .installed
            if err != nil {
               newState = .redundant
            }
            
            do {
                
                try self.updateWorkerStatus(worker: worker, newState: newState)
                
                if err == nil && (worker.skipWaitingStatus == true || self.active == nil) {
                    self.activateWorker(worker: worker, cb: cb)
                } else {
                    cb(err, true)
                }
                
            } catch {
                cb(error, true)
            }
            
            
        }
    }
    
    fileprivate func activateWorker(worker:ServiceWorker, cb: @escaping RegisterCallback) {
        
        // This matches the API but it seems kind of weird - an activating worker goes into
        // the active slot, but a worker can fail to activate. If that happens, we want to
        // restore the previous version of the worker. I think?
        let lastActiveWorker = self.active
        let ev = ExtendableEvent(type: "activate")
        
        do {
            try self.updateWorkerStatus(worker: worker, newState: .activating)
            try worker.dispatchEvent(ev)
        } catch {
            do {
                try self.updateWorkerStatus(worker: worker, newState: .redundant)
            } catch {
                Log.error?("Could not update broken worker to redundant status")
            }
            cb(error, nil)
            return
        }
        
        ev.resolve { err in
            
            var newState: ServiceWorkerInstallState = .activated

            if err != nil {
                newState = .redundant
                self.active = lastActiveWorker
            }
            
            do {
                try self.updateWorkerStatus(worker: worker, newState: newState)
                cb(err, true)
            } catch {
                cb(error, true)
            }
            
        }
    }
    
    func clearWorkerFromAllStatuses(worker:ServiceWorker) {
        if self.active == worker {
            self.active = nil
        } else if self.waiting == worker {
            self.waiting = nil
        } else if self.installing == worker {
            self.installing = nil
        } else if self.redundant == worker {
            self.redundant = nil
        }
    }
    
    
    func updateWorkerStatus(worker: ServiceWorker, newState: ServiceWorkerInstallState) throws {
        try CoreDatabase.inConnection { db in
            try db.inTransaction {
                
                // If there's already a worker in the slot we want, we need to update its state
                var existingWorker:ServiceWorker?
                if newState == .installing {
                    existingWorker = self.installing
                } else if newState == .installed {
                    existingWorker = self.waiting
                } else if newState == .activating || newState == .activated {
                    existingWorker = self.active
                }
                
                if existingWorker != nil && existingWorker != worker {
                    // existingWorker != worker because it'll be the same worker when going from activating to activated
                    try db.update(sql: "UPDATE workers SET install_state = ? WHERE worker_id = ?", values: [ServiceWorkerInstallState.redundant.rawValue, existingWorker!.id])
                    existingWorker!.state = .redundant
                    self.redundant = existingWorker
                }
                
                try db.update(sql: "UPDATE workers SET install_state = ? WHERE worker_id = ?", values: [newState.rawValue, worker.id])
                worker.state = newState
                self.clearWorkerFromAllStatuses(worker: worker)
                if newState == .installing {
                    self.installing = worker
                } else if newState == .installed {
                    self.waiting = worker
                } else if newState == .activating || newState == .activated {
                    self.active = worker
                } else if newState == .redundant {
                    self.redundant = worker
                }
                
            }
        }
    }
    
    fileprivate static let activeInstances = NSHashTable<ServiceWorkerRegistration>.weakObjects()
    
    static public func get(scope:URL) throws -> ServiceWorkerRegistration? {
        
        let active = self.activeInstances.allObjects.filter { $0.scope == scope}.first
        
        if active != nil {
            return active
        }
        
        return try CoreDatabase.inConnection() { connection in
            
            return try connection.select(sql: "SELECT * FROM registrations WHERE scope = ?", values: [scope.absoluteString]) { rs -> ServiceWorkerRegistration? in
                
                if rs.next() == false {
                    // If we don't already have a registration, return nil (get() doesn't create one)
                    return nil
                }
                
                let reg = ServiceWorkerRegistration(scope: scope)
                
                // Need to add this now, as WorkerInstances.get() uses our static storage and
                // we don't want to get into a loop
                self.activeInstances.add(reg)
                
                if let activeId = try rs.string("active") {
                    reg.active = try WorkerInstances.get(id: activeId)
                }
                if let waitingId = try rs.string("waiting") {
                    reg.waiting = try WorkerInstances.get(id: waitingId)
                }
                if let installingId = try rs.string("installing") {
                    reg.installing = try WorkerInstances.get(id: installingId)
                }
                if let redundantId = try rs.string("redundant") {
                    reg.redundant = try WorkerInstances.get(id: redundantId)
                }
                
                return reg
            }
            
        }
        
        
    }
    
    static public func create(scope:URL) throws -> ServiceWorkerRegistration {
        
        return try CoreDatabase.inConnection() { connection in
            _ = try connection.insert(sql: "INSERT INTO registrations (scope) VALUES (?)", values: [scope])
            let reg = ServiceWorkerRegistration(scope: scope)
            self.activeInstances.add(reg)
            return reg
        }
        
    }
    
    static public func getOrCreate(scope:URL) throws -> ServiceWorkerRegistration {
        
        if let existing = try self.get(scope: scope) {
            return existing
        } else {
            return try self.create(scope: scope)
        }
        
    }
    
}



