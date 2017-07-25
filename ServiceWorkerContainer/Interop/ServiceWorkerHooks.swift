//
//  ServiceWorkerHooks.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 24/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import ServiceWorker
import Shared

class ServiceWorkerHooks {
    
    static func importScripts(worker: ServiceWorker, scripts: [URL]) throws -> [String] {
        return []
    }
    
    static func loadContent(worker: ServiceWorker) -> String {
        
        var script = ""
        do {
            script = try CoreDatabase.inConnection { db in
                return try db.select(sql: "SELECT content FROM workers WHERE worker_id = ?", values: [worker.id]) { resultSet in
                    if resultSet.next() == false {
                        throw ErrorMessage("Worker does not exist")
                    }
                    return try resultSet.string("content")!
                }
            }
        }
        catch {
            // This seems weird, but there's no other easy way to throw an error here.
            script = "throw new Error('\(String(describing: error))')"
        }
        
        return script
    }
    
}
