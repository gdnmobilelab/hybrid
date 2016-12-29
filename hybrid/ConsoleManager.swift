//
//  ConsoleManager.swift
//  hybrid
//
//  Created by alastair.coote on 10/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import PromiseKit


/// A bridge to allow console messages in WKWebViews to be transmitted over to internal app logs.
class ConsoleManager: ScriptMessageManager {
    
    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "console")
    }
    
    
    /// Log a console message
    ///
    /// - Parameter message: An object with a "level" string and an "args" array of items to log
    /// - Returns: nil
    override func handleMessage(_ message:[String: Any]) -> Promise<String>? {
        
        let level = message["level"] as! String
        let arguments = message["args"] as? [String]
        
        if arguments == nil {
            log.error("Console attempt without arguments")
            return nil
        }
        
        let argsJoined = arguments!.joined(separator: " ")
        
        if level == "debug" {
            log.debug(argsJoined)
        } else if level == "info" {
            log.info(argsJoined)
        } else if level == "warn" {
            log.warning(argsJoined)
        } else if level == "error" {
            log.error(argsJoined)
        } else {
            log.info(argsJoined)
        }
        
        return nil
    }
}
