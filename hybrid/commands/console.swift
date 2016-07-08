//
//  console.swift
//  hybrid
//
//  Created by alastair.coote on 14/06/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import ObjectMapper

class LogMessage : Mappable {
    var level:String!
    var text:String!
    
    required init?(_ map: Map) {
        
    }
    
    func mapping(map: Map) {
        level    <- map["level"]
        text     <- map["text"]
    }
}

class Console {
    static func logLevel(arguments:String, webviewURL:NSURL) -> Promise<AnyObject> {
        
        let logDetails = Mapper<LogMessage>().map(arguments)!
        
        switch (logDetails.level) {
        case "info":
            log.info(logDetails.text);
            break;
        case "error":
            log.error(logDetails.text);
            break;
        default:
            log.info(logDetails.text);
        }
        
        return Promise<AnyObject>(true)
        
    }
}

