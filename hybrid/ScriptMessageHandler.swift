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
    class HandleMessageNotImplementedError : Error {}
    
    let webview:HybridWebview
    let userController:WKUserContentController
    
    
    /// The name for this handler - must be unique per webview, as it creates
    /// window.__promiseBridges[handlerName] in the global context
    let handlerName:String
    
    
    /// Just for sanity's sake, a struct to store the fulfill and reject halves of a promise
    struct PromiseStore {
        var fulfill: (Any) -> ()
        var reject: (Error) -> ()
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
    func sendEventAwaitResponse(_ name: String, arguments: [String]) -> Promise<Any> {
        return Promise<Any> { fulfill, reject in
            
            // Find an available index
            
            var index = 0
            while pendingPromises[index] != nil {
                index = index + 1
            }
            
            self.pendingPromises[index] = PromiseStore(fulfill: fulfill, reject: reject)

            self.webview.evaluateJavaScript("window.__promiseBridges['" + self.handlerName + "'].emitWithResponse('" + name + "',[" + arguments.joined(separator: ",") + "]," + String(index) + ")", completionHandler: nil)
        }
    }
    
    init(userController: WKUserContentController, webView: HybridWebview, handlerName:String) {
        self.webview = webView
        self.userController = userController
        self.handlerName = handlerName
        super.init()
        self.userController.add(self, name: handlerName)
    }
    
    
    /// This function must be overridden by derived classes
    ///
    /// - Parameter message: The message to send
    /// - Returns: If not overridden, will throw a HandleMessageNotImplementedError
    func handleMessage(_ message:[String: Any]) -> Promise<String>? {
        return Promise<String?>(value: nil)
        .then { _ in
            throw HandleMessageNotImplementedError()
        }
        
    }
    
    
    /// Send an event into the webview, without waiting for a response.
    ///
    /// - Parameters:
    ///   - name: Name of the event to send
    ///   - arguments: An array of JSON strings to send to the JS function. Note: this means strings should be surrounded in ""s, numbers should not.
    func sendEvent(_ name:String, arguments: [String]) {
        self.webview.evaluateJavaScript("window.__promiseBridges['" + self.handlerName + "'].emit('" + name + "'," + arguments.joined(separator: ",") +  ")", completionHandler:  {resp, err in
            if err != nil {
                let mapped = self.webview.url
                log.error("Failed to send event " + name + " to handler " + self.handlerName + ": " + String(describing: err!))
            }
        })
    }
    
    
    /// Function that processes responses coming from inside the webview.
    @objc func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        
        let bodyAsObject = message.body as! [String: Any]
        
        let messageContents = bodyAsObject["message"] as! [String: Any]
        
        
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
            
            self.pendingPromises.removeValue(forKey: callbackResponseIndex)
            return
        }
        
        let callbackIndex = bodyAsObject["callbackIndex"] as? Int
        let processResult = self.handleMessage(messageContents)
        if processResult != nil && callbackIndex != nil {
            
            let functionName = "window.__promiseBridgeCallbacks['" + self.handlerName + "']"
            
            let errorCatcher = { (resp:Any?, err: Error?) in
                if err != nil {
                    log.error("it failed: " + String(describing: err))
                }
            }
            
            processResult!
                .then { result -> Void in
                    
                    self.webview.evaluateJavaScript(functionName + "(" + String(callbackIndex!) + ",null," + result + ")", completionHandler: errorCatcher)
                }
                .catch { err in
                    log.error("Error in promise: " + String(describing: err))
                    self.webview.evaluateJavaScript(functionName + "(" + String(callbackIndex!) + ",'" + String(describing: err) + "')", completionHandler: errorCatcher)
            }
        }
    }
}
