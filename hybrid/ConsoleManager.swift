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

class ConsoleManager: ScriptMessageManager {
    
    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "console")
    }
    
    override func handleMessage(message:AnyObject) -> Promise<String>? {
        
        let level = message["level"] as! String
        let arguments = message["args"] as? [String]
        
        if arguments == nil {
            log.error("Console attempt without arguments")
            return nil
        }
        
        let argsJoined = arguments!.joinWithSeparator(" ")
        
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
