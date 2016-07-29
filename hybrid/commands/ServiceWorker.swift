//
//  ServiceWorker.swift
//  hybrid
//
//  Created by alastair.coote on 15/06/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Alamofire
import PromiseKit
import ObjectMapper

class ServiceWorkerRegisterOptions : Mappable {
    var scope:String?
    
    required init?(_ map: Map) {
        
    }
    
    func mapping(map: Map) {
        scope    <- map["scope"]
    }
}

class ServiceWorkerRegisterRequest : Mappable {
    var path:NSURL!;
    var pathAsString:String!
    var options:ServiceWorkerRegisterOptions?;
    
    required init?(_ map: Map) {
        
    }
    
    func mapping(map: Map) {
        path    <- (map["path"], URLTransform())
        options <- map["options"]
    }
}




class ServiceWorkerCommands {
    
    static func Register(arguments:String, webviewURL:NSURL) -> Promise<AnyObject> {
       
        let registerRequest = Mapper<ServiceWorkerRegisterRequest>().map(arguments)!
        
        let urlOfServiceWorker = URLUtilities.resolveToBaseURL(registerRequest.path, baseURL: webviewURL)
        var serviceWorkerScope:NSURL? = nil
        if (registerRequest.options?.scope != nil) {
            serviceWorkerScope = URLUtilities.resolveToBaseURL(NSURL(string: registerRequest.options!.scope!)!, baseURL: webviewURL)
        }
        
        return ServiceWorkerManager.update(urlOfServiceWorker, scope: serviceWorkerScope!)
        .then { response in
            return Promise<AnyObject>(UpdateResultToBool(response))
        }
        
    }
    
    private static func UpdateResultToBool(result: ServiceWorkerUpdateResult) -> Bool {
        if (result == ServiceWorkerUpdateResult.Failed || result == ServiceWorkerUpdateResult.NoUpdateNeeded) {
            return false
        }
        
        if (result == ServiceWorkerUpdateResult.New || result == ServiceWorkerUpdateResult.UpdatedExisting) {
            return true
        } else {
            return false
        }
    }
    
    
    static func Update(urlOfServiceWorker:NSURL, scope:NSURL) -> Promise<AnyObject> {
        
        return ServiceWorkerManager.update(urlOfServiceWorker, scope: scope)
            .then { response in
                return Promise<AnyObject>(UpdateResultToBool(response))
            }
    }
}

//let headersAsJSON = try NSJSONSerialization.dataWithJSONObject(container.response.allHeaderFields, options: NSJSONWritingOptions.PrettyPrinted)
//
//let headersAsJSONString = String(data: headersAsJSON, encoding: NSUTF8StringEncoding)
//
//
//
//return DbTransactionPromise<ServiceWorkerUpdateResult> { db in
//    try db.executeUpdate("INSERT INTO cache (resource_url, last_modified, etag, contents, headers) VALUES (?,?,?,?,?)", values: [urlOfServiceWorker, lastModAsTimeInterval, NSNull(), container.data!, headersAsJSONString! ] as [AnyObject])
//    
//    let response = existingRecord == true ? ServiceWorkerUpdateResult.UpdatedExisting : ServiceWorkerUpdateResult.New
//    
//    return Promise<ServiceWorkerUpdateResult>(response)
//}

