//
//  Console.swift
//  hybrid
//
//  Created by alastair.coote on 02/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol ConsoleExports: JSExport {
    static func logMessage(level:String, arguments:[AnyObject])
}

@objc class Console : NSObject, ConsoleExports {
    static func logMessage(level:String, arguments:[AnyObject]) {
        
        var argsTextArray = [String]()
        
        for arg in arguments {
            argsTextArray.append(String(arg))
        }
        
        
        let argsText = argsTextArray.joinWithSeparator(" ")
        
        if level == "info" || level == "log" {
            log.info(argsText)
        }
        else if level == "warn" {
            log.warning(argsText)
        }
        else if level == "error" {
            log.error(argsText)
        }
        
    }
}
