//
//  ServiceWorkerRegister.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

struct ServiceWorkerRegisterMessage {
    
    let scriptURL:URL
    let scope: URL
    
    static func fromPayload(payload: Any, webviewURL: URL) throws -> ServiceWorkerRegisterMessage {
        
        let args = payload as! [AnyObject]
        
        
        let scriptURL = URLOrNilFromString(args[0] as? String, relativeTo: webviewURL)
        let options = args[1] as AnyObject?
        
        if scriptURL == nil {
            throw ErrorMessage("Must provide a scriptURL when registering a service worker.")
        }
        
        var scope = URLOrNilFromString(options?["scope"] as? String, relativeTo: webviewURL)
        
        if scope == nil {
            // Default to the directory of the script file.
            scope = scriptURL!.deletingLastPathComponent()
        }
        
        return ServiceWorkerRegisterMessage(scriptURL: scriptURL!, scope: scope!)
    }
}
