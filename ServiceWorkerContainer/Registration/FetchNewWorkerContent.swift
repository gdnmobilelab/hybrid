//
//  FetchNewWorkerContent.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import FMDB
import HybridShared
import ServiceWorker

fileprivate struct URLAndHeaders {
    let url:URL
    let headers: FetchHeaders
}

class FetchNewWorkerContent {
    
    fileprivate static func getExistingHeaders(forWorkerId id: String) throws {
        
        try Database.inDatabase { db in
            
            let resultSet = try db.executeQuery("""
                SELECT url, headers FROM workers WHERE worker_id = ?
                UNION
                SELECT url, headers FROM worker_imported_scripts WHERE worker_id = ?
            """, values: [id, id])
            
            var existingAssets: [URLAndHeaders] = []
            
            while resultSet.next() {
                
                let url = URL(string: resultSet.string(forColumn: "url")!)!
                let headers = try FetchHeaders.fromJSON(resultSet.string(forColumn: "headers")!)
                
                existingAssets.append(URLAndHeaders(url: url, headers: headers))
                
            }
            
            resultSet.close()
            
        }
        
        
    }
    
}
