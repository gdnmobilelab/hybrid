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
            
//            
//            
//            var scope = "./"
//            
//            if (args.options?.scope != nil) {
//                scope = args.options!.scope!
//            }
//            
//            let fullScopeURL = NSURL(string: scope, relativeToURL: urlOfServiceWorker)!
//            
//            try Db.inTransaction({ (db) in
//                
//                let results = try db.executeQuery("SELECT count(*) as numServiceWorkers FROM service_workers WHERE url = ?", values: [urlOfServiceWorker.absoluteString])
//                
//                results.next()
//                
//                let alreadyExists = results.intForColumn("numServiceWorkers") == 1
//                
//                if (alreadyExists == false) {
//                    try db.executeUpdate("INSERT INTO service_workers (url, scope, install_state) VALUES (?,?,?)", values: [
//                        urlOfServiceWorker.absoluteString,
//                        fullScopeURL.absoluteString,
//                        ServiceWorkerInstallState.Pending.hashValue
//                        ])
//                }
//                
//                
//            })
            
            //log.info("Hmm: " + args.path + args.options!.scope!)
            callback!(returnError: nil, returnValue: "HELLO TEST");
        } catch {
            callback!(returnError: String(error), returnValue: nil)
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
    
    static func GetLastUpdated(url:NSURL) -> Promise<NSDate?> {
        return Promise { fulfill, reject in
            Alamofire.request(.HEAD, url)
                .response(completionHandler: { (req: NSURLRequest?, res: NSHTTPURLResponse?, data: NSData?, err: NSError?) in
                    if err != nil {
                        reject(err!)
                    } else {
                        
                        let lastModHeader = GetHeaderCaseInsensitive(res!, name: "last-modified")
                        
                        if (lastModHeader == nil) {
                            fulfill(nil)
                            return
                        }
                        
                        let dateFormat = NSDateFormatter()
                        dateFormat.dateFormat = "EEE, dd MMM yyyy HH:mm:ss z"
                        dateFormat.locale = NSLocale(localeIdentifier: "en_US_POSIX")
                        
                        let date = dateFormat.dateFromString(lastModHeader!)
                        
                        fulfill(date)
                    }
                })
        }
    }
    
    static func Update(urlOfServiceWorker:NSURL) -> Promise<String> {
        
        return GetLastUpdated(urlOfServiceWorker)
        .then { lastMod in
            
            Db.TransactionPromise({ (db) -> Promise<AnyObject> in
                return Promise<AnyObject>("wtf")
            })
            
            return Promise<String>("test")
        }
        
        
        
//        
//        Alamofire.request(.HEAD, urlOfServiceWorker)
//            .response(completionHandler: { (req: NSURLRequest?, res: NSHTTPURLResponse?, data: NSData?, err: NSError?) in
//                
//                if err != nil {
//                    log.error(err!.description)
//                    return
//                }
//                
//                let lastModified = GetHeaderCaseInsensitive(res!, name: "last-modified")
//                NSLog("last mod " + lastModified!)
//                
//                try Db.inTransaction({ (db) in
//                    
//                })
//                
//            })
        
    }
}
