//
//  ScriptMessageHandler.swift
//  hybrid
//
//  Created by alastair.coote on 10/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import PromiseKit
import ObjectMapper

class HandleMessageNotImplementedError : ErrorType {}

class ScriptMessageManager: NSObject, WKScriptMessageHandler {
    
    let webview:WKWebView
    let userController:WKUserContentController
    let handlerName:String
    
    init(userController: WKUserContentController, webView: WKWebView, handlerName:String) {
        self.webview = webView
        self.userController = userController
        self.handlerName = handlerName
        super.init()
        self.userController.addScriptMessageHandler(self, name: handlerName)
    }
    
    func handleMessage(message:AnyObject) -> Promise<String>? {
        return Promise<String?>(nil)
            .then { _ in
                throw HandleMessageNotImplementedError()
        }
        
    }
    
    @objc func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        
        let callbackIndex = message.body["callbackIndex"] as? Int
        let messageContents = message.body["message"]!
        let processResult = self.handleMessage(messageContents!)
        if processResult != nil && callbackIndex != nil {
            
            let functionName = "window.__promiseBridgeCallbacks['" + self.handlerName + "']"
            
            let errorCatcher = { (resp:AnyObject?, err: NSError?) in
                if err != nil {
                    log.error(String(err))
                }
            }
            
            processResult!
                .then { result -> Void in
                   
                    self.webview.evaluateJavaScript(functionName + "(" + String(callbackIndex!) + ",null," + result + ")", completionHandler: errorCatcher)
                }
                .error { err in
                    log.error(String(err))
                    self.webview.evaluateJavaScript(functionName + "(" + String(callbackIndex!) + "," + String(err) + ")", completionHandler: errorCatcher)
            }
        }
    }
}
