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
    var error:String?
    var insertId:Int?
    var rowsAffected:Int!
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
    
    init(url:NSURL) {
        
        // WebSQL DBs are stored according to origin (i.e. protocol + hostname)
        
        let urlComponents = NSURLComponents(URL: url, resolvingAgainstBaseURL: false)!
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
            
            //activeDBInstances[spareIndex]!.open()
            
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
    
    private func execSingleQuery(dbInstance:FMDatabase, query:WebSQLQuery, readOnly:Bool) -> WebSQLResult {
        
        let result = WebSQLResult()
        
        var isSelect = false
        
        if (query.sql.lengthOfBytesUsingEncoding(NSUTF8StringEncoding) > 6) {
            isSelect = query.sql.substringWithRange(Range<String.Index>(start: query.sql.startIndex, end: query.sql.startIndex.advancedBy(6))).uppercaseString == "SELECT"
        }
        log.debug(query.sql)
        if (readOnly == false && isSelect == false) {
            
            do {
                try dbInstance.executeUpdate(query.sql, values: query.args)
                
                
                result.insertId = Int(dbInstance.lastInsertRowId())
                
                result.rowsAffected = Int(dbInstance.changes())
                return result

            } catch {
                result.error = dbInstance.lastErrorMessage()
                return result
            }
            
        } else {
            do {
                let resultSet = try dbInstance.executeQuery(query.sql, values: query.args)
                
                
                while resultSet.next() {
                    result.rows.append(resultSet.resultDictionary() as! [String:AnyObject])
                }
                
                //result.rowsAffected = Int(result.rows.count)
                return result;
                
            } catch {
                result.error = dbInstance.lastErrorMessage()
                return result
            }
            
        }
    }
    
    func closeAll() {
        for (key, val) in self.activeDBInstances {
            val.close()
        }
    }
    
    func execDatabaseQuery(dbIndex:Int, queriesAsString: String, readOnly:Bool) -> String {
        
        let dbInstance = self.activeDBInstances[dbIndex]!
        // Might already be open, but let's make sure
        dbInstance.open()
        
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