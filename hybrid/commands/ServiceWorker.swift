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

enum ServiceWorkerInstallState {
    case Installing
    case Installed
    case Activating
    case Activated
    case Redundant
}

enum ServiceWorkerUpdateResult {
    case New
    case Failed
    case NoUpdateNeeded
    case UpdatedExisting
}


class ServiceWorker {
    
    private static let libraryDir:String = NSSearchPathForDirectoriesInDomains(.LibraryDirectory, .UserDomainMask, true)[0]
    
    static func Register(arguments:String, webviewURL:NSURL) -> Promise<AnyObject> {
       
        let registerRequest = Mapper<ServiceWorkerRegisterRequest>().map(arguments)!
        
        let urlOfServiceWorker = URLUtilities.resolveToBaseURL(registerRequest.path, baseURL: webviewURL)
        var serviceWorkerScope:NSURL? = nil
        if (registerRequest.options?.scope != nil) {
            serviceWorkerScope = URLUtilities.resolveToBaseURL(NSURL(string: registerRequest.options!.scope!)!, baseURL: webviewURL)
        }
        
        
        return Update(urlOfServiceWorker, scope: serviceWorkerScope)
        .then { response in
            
            if (response == ServiceWorkerUpdateResult.Failed || response == ServiceWorkerUpdateResult.NoUpdateNeeded) {
                return Promise<AnyObject>(false)
            }
            
            if (response == ServiceWorkerUpdateResult.New || response == ServiceWorkerUpdateResult.UpdatedExisting) {
                return Promise<AnyObject>(true)
            } else {
                return Promise<AnyObject>(false)
            }
            
        }
        
    }
    
    // Amazon S3, at least, seems to return headers in lowercase. So we need to accommodate that.
    static func GetHeaderCaseInsensitive(res:NSHTTPURLResponse, name:String) -> String? {
        let nameLowerCase = name.lowercaseString
        
        for (key, val) in res.allHeaderFields {
            if String(key).lowercaseString == nameLowerCase {
                return String(val)
            }
        }
        return nil
    }
    
    static func HTTPDateToNSDate(httpDate:String) -> NSDate? {
        let dateFormat = NSDateFormatter()
        dateFormat.dateFormat = "EEE, dd MMM yyyy HH:mm:ss z"
        dateFormat.locale = NSLocale(localeIdentifier: "en_US_POSIX")
        
        let date = dateFormat.dateFromString(httpDate)
        return date

    }
    
    static func GetLastUpdated(url:NSURL) -> Promise<NSDate?> {
        
        return Promisified.AlamofireRequest(Alamofire.Method.HEAD, url: url)
        .then({ container in
            let lastModHeader = GetHeaderCaseInsensitive(container.response, name: "last-modified")
            
            if (lastModHeader == nil) {
                return Promise<NSDate?>(nil)
            }
            
            let asDate = HTTPDateToNSDate(lastModHeader!)
            return Promise<NSDate?>(asDate)
        })
    }
    
    static func Update(urlOfServiceWorker:NSURL, scope:NSURL?) -> Promise<ServiceWorkerUpdateResult> {
        
        var existingRecord: Bool!
        
        return GetLastUpdated(urlOfServiceWorker)
        .then { lastMod in
            return DbTransactionPromise<Bool> { db in
                
                if (lastMod == nil) {
                    // if there's no last modified header(?!?) then we'll be forced to run
                    // an update
                    return Promise<Bool>(true)
                }
                
                // Get the most recent service worker installation
                
                let result = try db.executeQuery("SELECT * FROM service_workers WHERE url = ? ORDER BY last_modified LIMIT 1", values: [urlOfServiceWorker])
                
                existingRecord = result.next()
                if (existingRecord == false) {
                    
                    // If there's no existing service worker record, we must update
                    
                    return Promise<Bool>(true)
                }
                let lastSeenModifiedDate = NSDate(timeIntervalSince1970: result.doubleForColumn("last_modified"))
                
                // Otherwise, we do a date comparison between the header and result to see if we need to update
                return Promise<Bool>(lastMod!.compare(lastSeenModifiedDate) == NSComparisonResult.OrderedDescending)
            }
            
        }.then { needsUpdate in
            if (needsUpdate == false) {
                return Promise<ServiceWorkerUpdateResult>(ServiceWorkerUpdateResult.NoUpdateNeeded)
            }
            
            return Promisified.AlamofireRequest(Alamofire.Method.GET, url: urlOfServiceWorker)
                .then { container in
                
                let lastMod = GetHeaderCaseInsensitive(container.response, name: "last-modified")
                let lastModAsTimeInterval = HTTPDateToNSDate(lastMod!)!.timeIntervalSince1970
                    
                let scopeOrNull = scope == nil ? NSNull() : scope!
                
                return DbTransactionPromise<ServiceWorkerUpdateResult> { db in
                    try db.executeUpdate("INSERT INTO service_workers (url, scope, last_modified, contents, install_state) VALUES (?,?,?,?,?)", values: [urlOfServiceWorker, scopeOrNull, lastModAsTimeInterval, container.data!, ServiceWorkerInstallState.Installing.hashValue ] as [AnyObject])
                    
                    let response = existingRecord == true ? ServiceWorkerUpdateResult.UpdatedExisting : ServiceWorkerUpdateResult.New
                    
                    return Promise<ServiceWorkerUpdateResult>(response)
                }
            }
        }
        .recover { err in
            return Promise<ServiceWorkerUpdateResult>(ServiceWorkerUpdateResult.Failed)
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

