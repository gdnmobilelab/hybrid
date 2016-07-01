//
//  console.swift
//  hybrid
//
//  Created by alastair.coote on 14/06/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class Console {
    static func logLevel(arguments:AnyObject, webviewURL:NSURL, callback: Callback?) {
        
        let level = arguments["level"] as! String;
        let text = arguments["text"] as! String;
        
        switch (level) {
        case "info":
            log.info(text);
            break;
        case "error":
            log.error(text);
            break;
        default:
            log.info(text);
        }
        
    }
}

