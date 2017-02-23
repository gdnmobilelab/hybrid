//
//  ConsoleInterceptor.swift
//  hybrid
//
//  Created by alastair.coote on 21/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import HybridShared

class ConsoleInterceptor : NSObject, HybridMessageReceiver {
    
    static let jsClassName = "ConsoleInterceptor"
    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>? {
        
        let arguments = (msg.data as! [String]).joined(separator: ",")
        
        if msg.command == "log" {
            log.logln(arguments)
        } else if msg.command == "debug" {
            log.debug(arguments)
        } else if msg.command == "info" {
            log.info(arguments)
        } else if msg.command == "warn" {
            log.warning(arguments)
        } else if msg.command == "error" {
            log.error(arguments)
        } else {
            return Promise(error: ErrorMessage("Did not understand log level " + msg.command))
        }
        
        return Promise(value: nil)
    }
    
    static func createFromJSArguments(args: [Any?], from: HybridMessageManager) throws -> HybridMessageReceiver {
        return ConsoleInterceptor()
    }
    
    func getArgumentsForJSMirror() throws -> [Any?] {
        throw ErrorMessage("Cannot be created on native side")
    }
    
}
