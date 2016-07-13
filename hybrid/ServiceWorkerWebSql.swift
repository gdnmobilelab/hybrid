//
//  ServiceWorkerWebSql.swift
//  hybrid
//
//  Created by alastair.coote on 12/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import ObjectMapper
import PromiseKit
import FMDB
import JavaScriptCore

class WebSQLQuery : Mappable {
    var sql:String!
    var args:[AnyObject]!
    
    required init?(_ map: Map) {
        
    }
    
    func mapping(map: Map) {
        sql      <- map["sql"]
        args     <- map["args"]
    }
}

class WebSQLResult: Mappable {
    var error:JSContextError?
    var insertId:Int64?
    var rowsAffected:Int32!
    var rows = [[String:AnyObject]]()
    
    required init?(_ map: Map) {
        
    }
    
    init() {
       
    }
    
    func mapping(map: Map) {
        error        <- map["error"]
        insertId     <- map["insertId"]
        rowsAffected <- map["rowsAffected"]
        rows         <- map["rows"]
    }
}

class WebSQL {
    
    var activeDBInstances = [Int:FMDatabase]()
    var origin:String!
    
    init(url:String) {
        
        // WebSQL DBs are stored according to origin (i.e. protocol + hostname)
        
        let urlComponents = NSURLComponents(string: url)!
        urlComponents.path = nil
        
        origin = urlComponents.URLString
        
    }
    
    func createConnection(name:String) -> Int {
        
        do {
            
            let sanitisedOrigin = NSMutableString(string: origin)
            
            let regex = try NSRegularExpression(pattern: "([^A-Za-z0-9]*)", options: .CaseInsensitive)
            
            regex.replaceMatchesInString(sanitisedOrigin, options: [], range: NSRange(0..<origin.utf16.count), withTemplate: "")
            

            
            let dbPath = try Db.getFullDatabasePath(sanitisedOrigin as String, dbFilename: name)
            
            var spareIndex = 0
            
            while activeDBInstances[spareIndex] != nil {
                spareIndex += 1
            }
            
            activeDBInstances[spareIndex] = FMDatabase(path: dbPath)
            
            activeDBInstances[spareIndex]!.open()
            
            return spareIndex
        } catch {
            log.error(String(error))
            return -1
        }
    }
    
    func hookFunctions(jsContext:JSContext) {
        let createConnectionConvention: @convention(block) (String) -> Int = self.createConnection
        jsContext.setObject(unsafeBitCast(createConnectionConvention, AnyObject.self), forKeyedSubscript: "__createWebSQLConnection")
        
        let execDatabaseQueryConvention: @convention(block) (Int, String, Bool) -> String = self.execDatabaseQuery
        jsContext.setObject(unsafeBitCast(execDatabaseQueryConvention, AnyObject.self), forKeyedSubscript: "__execDatabaseQuery")
    }
    
    private func execSingleQuery(db:FMDatabase, query:WebSQLQuery, readOnly:Bool) -> WebSQLResult {
        
        let result = WebSQLResult()
        
        if (readOnly == false) {
            
            let insertIdBeforeThis = db.lastInsertRowId()
            
            do {
                try db.executeUpdate(query.sql, values: query.args)
                
                let newInsertId = db.lastInsertRowId()
                
                if (newInsertId != insertIdBeforeThis) {
                    result.insertId = newInsertId
                }
                
                result.rowsAffected = db.changes()
                return result

            } catch {
                result.error = JSContextError(message: db.lastErrorMessage())
                return result
            }
            
        } else {
            do {
                let resultSet = try db.executeQuery(query.sql, values: query.args)
                
                
                while resultSet.next() {
                    result.rows.append(resultSet.resultDictionary() as! [String:AnyObject])
                }
                
                result.rowsAffected = Int32(result.rows.count)
                return result;
                
            } catch {
                result.error = JSContextError(message: db.lastErrorMessage())
                return result
            }
            
        }
    }
    
    func execDatabaseQuery(dbIndex:Int, queriesAsString: String, readOnly:Bool) -> String {
        
        let dbInstance = self.activeDBInstances[dbIndex]!
        
        let queryMapper = Mapper<WebSQLQuery>()
        let queriesAsObjects = queryMapper.mapArray(queriesAsString)!
        
        
        var results = [WebSQLResult]()
    
        for query in queriesAsObjects {
            results.append(execSingleQuery(dbInstance, query: query, readOnly: readOnly))
        }
        
        let resultsAsJSONArray = Mapper().toJSONString(results)!
     
        
        return resultsAsJSONArray
       
    }
}