//
//  ServiceWorkerManager.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit

struct ServiceWorkerDBResponse {
    var url: NSURL
    var contents:String?
    var scope: NSURL
}

class ServiceWorkerManager {
    
//    private static func getServiceWorkerWithScopeMatching(url:NSURL, getContents:Bool = false) throws -> ServiceWorkerDBResponse? {
//        
//        var returnValue:ServiceWorkerDBResponse? = nil
//        
//        try Db.mainDatabase.inDatabase { (db) in
//            
//            // order by length desc, because longer URLs are more specific = scope is more specific
//            
//            let resultSet = try db.executeQuery("SELECT url, scope FROM service_workers WHERE ? LIKE (scope || '%') AND install_state = ? ORDER BY length(scope) DESC", values: [url.absoluteString, ServiceWorkerInstallState.Activated.hashValue])
//            
//            if resultSet.next() == true {
//                
//                let swURL = NSURL(string:resultSet.stringForColumn("url"))!
//                returnValue = ServiceWorkerDBResponse(url: swURL, contents: resultSet.stringForColumn("contents"))
//            }
//        }
//        
//        return returnValue
//    }
    
//    static func getLocalURLIfInServiceWorkerScope(url:NSURL) throws -> NSURL? {
//        
//        let hasServiceWorker = try self.getServiceWorkerWithScopeMatching(url) != nil
//        
//        if (hasServiceWorker == false) {
//            return nil
//        }
//        
//        let returnComponents = NSURLComponents(string: "http://localhost")!
//        returnComponents.port = WebServer.current!.port
//        
//        let pathComponents:[String] = [
//            "__service_worker",
//            url.host!,
//            url.path!.substringFromIndex(url.path!.startIndex.advancedBy(1))
//        ]
//        
//        
//        returnComponents.path = "/" + pathComponents.joinWithSeparator("/")
//        NSLog(pathComponents.joinWithSeparator("/"))
//        return returnComponents.URL!
//
//    }
    
    static func getServiceWorkerForURL(url:NSURL) -> Promise<ServiceWorkerInstance?> {
        
        
        struct dbResponse {
            var url:NSURL
            var scope:NSURL
            var contents:String
        }
        
        return Promise<Void>()
        .then {
            var response:dbResponse? = nil
            
            
            try Db.mainDatabase.inDatabase { (db) in
                
                // order by length desc, because longer URLs are more specific = scope is more specific
                
                let resultSet = try db.executeQuery("SELECT url, scope, contents FROM service_workers WHERE ? LIKE (scope || '%') AND install_state = ? ORDER BY length(scope) DESC", values: [url.absoluteString, ServiceWorkerInstallState.Activated.hashValue])
                
                if resultSet.next() == false {
                    return
                }
                
                response = dbResponse(
                    url: NSURL(string: resultSet.stringForColumn("url")!)!,
                    scope: NSURL(string: resultSet.stringForColumn("scope")!)!,
                    contents: resultSet.stringForColumn("contents")!
                )
                
                
            }
            
            if (response == nil) {
                return Promise<ServiceWorkerInstance?>(nil)
            }
            
            let sw = ServiceWorkerInstance(url: response!.url, scope: response!.scope)
            
            return sw.loadServiceWorker(response!.contents)
                .then {_ in 
                    return Promise<ServiceWorkerInstance?>(sw)
            }
    
        }
        
        
        
    }
}