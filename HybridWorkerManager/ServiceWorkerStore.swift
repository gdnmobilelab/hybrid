//
//  ServiceWorkerStore.swift
//  hybrid
//
//  Created by alastair.coote on 08/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared
import HybridServiceWorker
import PromiseKit
import FMDB

class ServiceWorkerStore {
    
    func getAllWorkerRecords(forURL: URL, withScope: URL) throws -> [ServiceWorkerRecord] {

        return try self.getWorkerRecordsFor(whereString: "url = ? AND scope = ?", values: [forURL.absoluteString, withScope.absoluteString])
        
    }
    
    
    /// Fetches all worker records on a scope.
    ///
    /// - Parameters:
    ///   - forScope: the scope to check
    ///   - includingChildScopes: whether to also include 'child' scopes, .e.g /scope/subscope when forScope is /scope
    func getAllWorkerRecords(forScope: URL, includingChildScopes: Bool) throws -> [ServiceWorkerRecord]  {
        
        let whereString: String
        
        if includingChildScopes == false {
            whereString = "scope = ?"
        } else {
            whereString = "scope LIKE (? || '%')"
        }
        
        return try self.getWorkerRecordsFor(whereString: whereString, values: [forScope.absoluteURL])
        
    }
    
    func getAllWorkerRecords(forIds: [Int]) throws -> [ServiceWorkerRecord] {
        
        let questionMarks = forIds
            .map { _ in return "?" }
            .joined(separator: ",")
        
        
        return try self.getWorkerRecordsFor(whereString: "id IN (" + questionMarks + ")", values: forIds)
        
    }
    
    fileprivate func getWorkerRecordsFor(whereString: String, values: [Any]) throws -> [ServiceWorkerRecord] {
        var records = [ServiceWorkerRecord]()
        
        try Db.mainDatabase.inDatabase { db in
            
            let allWorkersResultSet = try db.executeQuery("SELECT instance_id,url,scope,headers,install_state,last_checked FROM service_workers WHERE " + whereString, values: values)
            
            while allWorkersResultSet.next() {
                do {
                    records.append( try self.workerRecordFromRow(allWorkersResultSet))
                } catch {
                    log.error("Could not create service worker from database copy: " + String(describing: error))
                }
                
                
            }
            
            allWorkersResultSet.close()
            
        }
        
        return records
    }
    
    func insertWorkerIntoDatabase(_ workerURL: URL, scope: URL, contents: String, headers: FetchHeaders) throws -> Int {
        
        let headerJSON = try headers.toJSON()
        
        var newId: Int = -1
        
        try Db.mainDatabase.inTransaction { db in
            
            let insert: [String:Any] = [
                "url": workerURL.absoluteString,
                "scope": scope.absoluteString,
                "contents": contents,
                "headers": headerJSON,
                "install_state": ServiceWorkerInstallState.installing.rawValue,
                "last_checked": self.rightNowInSeconds()
            ]
            
            let columns = insert.map {$0.key }.joined(separator: ",")
            let values = insert.map { $0.value }
            let questionMarks = values
                .map { _ in return "?" }
                .joined(separator: ",")
            
            try db.executeUpdate("INSERT INTO service_workers (" + columns + ") VALUES (" + questionMarks + ")", values: values)
            
            newId = Int(db.lastInsertRowId())
        }
        
        return newId
    }
    
    
    /// Worker JS can be several hundred KB big, so we only grab that content when we specifically need it
    func getWorkerContent(byId: Int) throws -> String {
        var contents:String? = nil
        
        try Db.mainDatabase.inDatabase { db in
            
            let resultSet = try db.executeQuery("SELECT contents FROM service_workers WHERE id = ?", values: [byId])
            
            if resultSet.next() == false {
                throw ErrorMessage("No worker exists with this ID")
            }
            
            contents = resultSet.string(forColumn: "contents")!
        }
        
        
        return contents!
    }
    
    
    fileprivate func rightNowInSeconds() -> Int {
        return Int(NSDate().timeIntervalSince1970)
    }
    
    fileprivate func workerRecordFromRow(_ rs: FMResultSet) throws -> ServiceWorkerRecord {
        
        let instanceId = Int(rs.int(forColumn: "instance_id"))
        let installState = ServiceWorkerInstallState(rawValue: Int(rs.int(forColumn: "install_state")))!
        let url = URL(string: rs.string(forColumn: "url"))!
        let scope = URL(string:rs.string(forColumn: "scope"))!
        let headersJSON = rs.string(forColumn: "headers")!
        let lastChecked = Int(rs.int(forColumn: "last_checked"))
        let headers = try FetchHeaders.fromJSON(headersJSON)
        
        return ServiceWorkerRecord(id: instanceId, url: url, scope: scope, headers: headers, lastChecked: lastChecked, installState: installState)
        
    }
    
}
