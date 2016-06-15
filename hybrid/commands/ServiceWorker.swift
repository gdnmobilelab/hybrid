//
//  ServiceWorker.swift
//  hybrid
//
//  Created by alastair.coote on 15/06/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


class ServiceWorker {
    static func Register(arguments:AnyObject, callback: Callback?) {
        let serviceWorkerPath = arguments["path"] as! String;
        let scope = arguments["opts"]!!["scope"] as? String;
        
        log.info("Hmm: " + serviceWorkerPath)
        callback!(returnValue: nil);

    }
}