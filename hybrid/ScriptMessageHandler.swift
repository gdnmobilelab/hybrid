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
import JavaScriptCore

class HandleMessageNotImplementedError : ErrorType {}

class ScriptMessageManager: NSObject, WKScriptMessageHandler {
    
    let webview:HybridWebview
    let userController:WKUserContentController
    let handlerName:String
    
    struct PromiseStore {
        var fulfill: (AnyObject) -> ()
        var reject: (ErrorType) -> ()
    }
    
    // We use this to send callbacks into the webview and await responses
    var pendingPromises = [Int: PromiseStore]()
    
    func sendEventAwaitResponse(name: String, arguments: [String]) -> Promise<AnyObject> {
        return Promise<AnyObject> { fulfill, reject in
            
            // Find an available index
            
            var index = 0
            while pendingPromises[index] != nil {
                index = index + 1
            }
            
            self.pendingPromises[index] = PromiseStore(fulfill: fulfill, reject: reject)

            self.webview.evaluateJavaScript("window.__promiseBridges['" + self.handlerName + "'].emitWithResponse('" + name + "',[" + arguments.joinWithSeparator(",") + "]," + String(index) + ")", completionHandler: nil)
        }
    }
    
    init(userController: WKUserContentController, webView: HybridWebview, handlerName:String) {
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
    
    func sendEvent(name:String, arguments: [String]) {
         self.webview.evaluateJavaScript("window.__promiseBridges['" + self.handlerName + "'].emit('" + name + "'," + arguments.joinWithSeparator(",") +  ")", completionHandler: nil)
    }
    
    @objc func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        
        let messageContents = message.body["message"] as! [String: AnyObject]
        
        
        if let callbackResponseIndex = messageContents["callbackResponseIndex"] as? Int {
            
            // This is the response to an emitWithResponse() call, so we shortcut
            // the usual handling of the message and send it directly to the waiting
            // promise.
            
            let pendingPromise = self.pendingPromises[callbackResponseIndex]!
            
            if let rejectValue = messageContents["rejectValue"] as? String {
                pendingPromise.reject(JSContextError(message: rejectValue))
            } else {
                pendingPromise.fulfill(messageContents["fulfillValue"]!)
            }
            
            self.pendingPromises.removeValueForKey(callbackResponseIndex)
            return
        }
        
        let callbackIndex = message.body["callbackIndex"] as? Int
        let processResult = self.handleMessage(messageContents)
        if processResult != nil && callbackIndex != nil {
            
            let functionName = "window.__promiseBridgeCallbacks['" + self.handlerName + "']"
            
            let errorCatcher = { (resp:AnyObject?, err: NSError?) in
                if err != nil {
                    log.error("it failed: " + String(err))
                }
            }
            
            processResult!
                .then { result -> Void in
                    
                    self.webview.evaluateJavaScript(functionName + "(" + String(callbackIndex!) + ",null," + result + ")", completionHandler: errorCatcher)
                }
                .error { err in
                    log.error("Error in promise: " + String(err))
                    self.webview.evaluateJavaScript(functionName + "(" + String(callbackIndex!) + ",'" + String(err) + "')", completionHandler: errorCatcher)
            }
        }
    }
}
