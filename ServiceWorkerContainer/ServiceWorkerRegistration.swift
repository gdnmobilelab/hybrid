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

class ServiceWorkerRegistration {
    
    let scope: URL
    var active: ServiceWorker?
    var waiting: ServiceWorker?
    var installing: ServiceWorker?
    var redundant: ServiceWorker?
    
    init(scope: URL) {
        self.scope = scope
    }
    
    static func getByScope(scope: URL) throws -> ServiceWorkerRegistration? {
        
        return try Database.inDatabase { db -> ServiceWorkerRegistration? in
            
            let results = try db.executeQuery("SELECT * FROM registrations WHERE scope = ?", values: [scope.absoluteString])
            
            if results.next() == false {
                return nil
            }
            
            let scope = results.string(forColumn: "scope")!
            
            let registration = ServiceWorkerRegistration(scope: URL(string: scope)!)
            
            return registration
            
        }
        
        
    }
    
    static func createForScope(scope: URL) throws -> ServiceWorkerRegistration {
        
        return try Database.inTransaction { db -> ServiceWorkerRegistration in
            try db.executeUpdate("INSERT INTO registrations (scope) VALUES (?)", values: [scope.absoluteString])
            return try getByScope(scope: scope)!
        }
    }
}

