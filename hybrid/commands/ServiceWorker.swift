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

struct ServiceWorkerRegisterOptions {
    let scope:String?
    
    init(args:Dictionary<String,AnyObject>) {
        self.scope = args["scope"] as? String
        
    }
    
    init(scope:String) {
        self.scope = scope
    }
}

struct ServiceWorkerRegisterRequest {
    let path:NSURL;
    let options:ServiceWorkerRegisterOptions?;
    
    init(args:AnyObject) {
        self.path = NSURL(string: args["path"] as! String)!;
        
        self.options = args["options"] as? ServiceWorkerRegisterOptions
        
    }
}

enum ServiceWorkerInstallState {
    case Pending
    case Parsed
    case Installing
    case Installed
    case Activating
    case Activated
    case Redundant
}


class ServiceWorker {
    
    private static let libraryDir:String = NSSearchPathForDirectoriesInDomains(.LibraryDirectory, .UserDomainMask, true)[0]
    
    static func Register(arguments:AnyObject, webviewURL:NSURL,  callback: Callback?) {
        do {
            let args = ServiceWorkerRegisterRequest(args: arguments);
            
            let urlOfServiceWorker = URLUtilities.resolveToBaseURL(args.path, baseURL: webviewURL)
            
            Update(urlOfServiceWorker)
                .then { didUpdate in
                    
                }
                .error { error in
                    callback!(returnError: String(error), returnValue: nil)
                }
        
            
            //log.info("Hmm: " + args.path + args.options!.scope!)
            callback!(returnError: nil, returnValue: "HELLO TEST");
        } catch {
            
        }
        
    }
    
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
    
    static func Update(urlOfServiceWorker:NSURL) -> Promise<Bool> {
        
        return GetLastUpdated(urlOfServiceWorker)
        .then { lastMod in
            return DbTransactionPromise<Bool> { db in
                
                if (lastMod == nil) {
                    // if there's no last modified header(?!?) then we'll be forced to run
                    // an update
                    return Promise<Bool>(true)
                }
                
                let result = try db.executeQuery("SELECT * FROM cache WHERE resource_url = ?", values: [urlOfServiceWorker])
                if (result.next() == false) {
                    return Promise<Bool>(true)
                }
                let lastSeenModifiedDate = NSDate(timeIntervalSince1970: result.doubleForColumn("last_modified"))
                
                return Promise<Bool>(lastMod!.compare(lastSeenModifiedDate) == NSComparisonResult.OrderedDescending)
            }
            
        }.then { needsUpdate in
            if (needsUpdate == false) {
                return Promise<Bool>(false)
            }
            
            return Promisified.AlamofireRequest(Alamofire.Method.GET, url: urlOfServiceWorker)
            .then({ container in
                
                let lastMod = GetHeaderCaseInsensitive(container.response, name: "last-modified")
                let lastModAsTimeInterval = HTTPDateToNSDate(lastMod!)!.timeIntervalSince1970
                let etag = GetHeaderCaseInsensitive(container.response, name: "e-tag")
                
                let headersAsJSON = try NSJSONSerialization.dataWithJSONObject(container.response.allHeaderFields, options: NSJSONWritingOptions.PrettyPrinted)
                
                let headersAsJSONString = String(data: headersAsJSON, encoding: NSUTF8StringEncoding)
                
                
                
                return DbTransactionPromise<Bool> { db in
                    try db.executeUpdate("INSERT INTO cache (resource_url, last_modified, etag, contents, headers) VALUES (?,?,?,?,?)", values: [urlOfServiceWorker, lastModAsTimeInterval, NSNull(), container.data!, headersAsJSONString! ] as [AnyObject])
                    log.info("Did it, apparently.")
                    return Promise<Bool>(true)
                }
            })
        }
        
        
    }
}
