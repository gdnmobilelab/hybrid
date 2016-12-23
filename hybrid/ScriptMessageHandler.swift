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


/// A bridge between our native code and WKWebView script, that allows us to store promises, run code
/// asynchonously on the native side, then resolve the original promise in the web client. This is a base
/// class that other inherit from to handle messages within their specific namespace.
class ScriptMessageManager: NSObject, WKScriptMessageHandler {
    
    
    /// If a derived class doesn't implement handleMessage() this error will be thrown.
    class HandleMessageNotImplementedError : ErrorType {}
    
    let webview:HybridWebview
    let userController:WKUserContentController
    
    
    /// The name for this handler - must be unique per webview, as it creates
    /// window.__promiseBridges[handlerName] in the global context
    let handlerName:String
    
    
    /// Just for sanity's sake, a struct to store the fulfill and reject halves of a promise
    struct PromiseStore {
        var fulfill: (AnyObject) -> ()
        var reject: (ErrorType) -> ()
    }
    
    /// We use this to store callbacks to be run in the webview and await responses
    var pendingPromises = [Int: PromiseStore]()
    
    
    /// Send an event into the webview and return a promise that will evaluate when the webview
    /// sends back a response
    ///
    /// - Parameters:
    ///   - name: The event name to fire
    ///   - arguments: An array of JSON strings to send to the JS function. Note: this means strings should be surrounded in ""s, numbers should not.
    /// - Returns: A promise that resolves with whatever object is passed back by the webview
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
    
    
    /// This function must be overridden by derived classes
    ///
    /// - Parameter message: The message to send
    /// - Returns: If not overridden, will throw a HandleMessageNotImplementedError
    func handleMessage(message:AnyObject) -> Promise<String>? {
        return Promise<String?>(nil)
            .then { _ in
                throw HandleMessageNotImplementedError()
        }
        
    }
    
    
    /// Send an event into the webview, without waiting for a response.
    ///
    /// - Parameters:
    ///   - name: Name of the event to send
    ///   - arguments: An array of JSON strings to send to the JS function. Note: this means strings should be surrounded in ""s, numbers should not.
    func sendEvent(name:String, arguments: [String]) {
        self.webview.evaluateJavaScript("window.__promiseBridges['" + self.handlerName + "'].emit('" + name + "'," + arguments.joinWithSeparator(",") +  ")", completionHandler:  {resp, err in
            if err != nil {
                log.error("Failed to send event: " + String(err))
            }
        })
    }
    
    
    /// Function that processes responses coming from inside the webview.
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
