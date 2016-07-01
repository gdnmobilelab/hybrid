//
//  MessageHandler.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit

typealias Callback = (returnError: AnyObject?, returnValue:AnyObject?) -> Void

struct HybridWebviewMessage {
    let command:String
    let arguments:Dictionary<String,AnyObject>?
    let callbackIndex:Int?
    let webviewURL:NSURL
    
    init(args:AnyObject, webviewURL: NSURL) {
        self.command = args["command"] as! String
        self.arguments = args["arguments"] as? Dictionary<String, AnyObject>
        self.callbackIndex = args["_callbackIndex"] as? Int
        self.webviewURL = webviewURL
    }
}


class HybridMessageHandler : NSObject, WKScriptMessageHandler {
    
    typealias MessageCommand = (arguments:AnyObject, webviewURL: NSURL, callback: Callback?) -> Void
    
    var webviewConfiguration:WKWebViewConfiguration;
    private var userContentController:WKUserContentController;
    
    private var registeredCommands = Dictionary<String, MessageCommand>();
    
    func anyObjectToJSON(obj:AnyObject) throws -> String {
        
        if (obj is String) {
            let objString = obj as! String
            return "\"" + objString + "\"";
        }
        
        if (obj is Int) {
            return String(obj)
        }
        
        let data = try NSJSONSerialization.dataWithJSONObject(obj, options: [])
        return String(data: data, encoding:NSUTF8StringEncoding)!
        
    }
    
    func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        
        let currentWebviewURL = message.webView!.URL!
        let args = HybridWebviewMessage(args: message.body, webviewURL: currentWebviewURL);
        
        if (registeredCommands[args.command] == nil) {
            log.error("Webview called command " + args.command + " but it isn't registered.");
        }
        
        // We need a way to pass data back into the webview. WKWebView doesn't have anything built in for this
        // so instead the JS library declares a function on the window object that we manually call to provide
        // the relevant data.
        
        var callback: Callback? = nil;
        
        if args.callbackIndex != nil {
            callback = { returnError, returnVal in
                
                var errorJS = "null";
                var returnJS = "null";
                
                if returnVal != nil {
                    do {
                        returnJS = try self.anyObjectToJSON(returnVal!)
                    }
                    catch _ {
                        log.error("Tried to stringify return value but failed. Command: " + args.command);
                    }
                }
                
                if returnError != nil {
                    do {
                        errorJS = try self.anyObjectToJSON(returnError!)
                    }
                    catch _ {
                        log.error("Tried to stringify return error but failed. Command: " + args.command);
                    }
                }
                
                
                let returnArgs = [String(args.callbackIndex!), errorJS, returnJS].joinWithSeparator(",")
                let js = "window._hybridCallback(" + returnArgs + ");";
                message.webView!.evaluateJavaScript(js, completionHandler: nil)
                
            }
        }
        
        
        registeredCommands[args.command]!(arguments: args.arguments!, webviewURL: currentWebviewURL, callback: callback);
        
    }
    
    override init() {
        webviewConfiguration = WKWebViewConfiguration();
        userContentController = WKUserContentController();
        
        webviewConfiguration.userContentController = userContentController;
        
        super.init();
        
        userContentController.addScriptMessageHandler(self, name: "hybrid");
        
        self.registerCommand("navigator.serviceWorker.register", functionToHandle: ServiceWorker.Register);
        self.registerCommand("console", functionToHandle: Console.logLevel);
    }
    
    func registerCommand(command:String, functionToHandle: MessageCommand) {
        
        if (registeredCommands[command] != nil) {
            log.error("Tried to register command " + command + ", but it's already registered.");
            return;
        }
        
        registeredCommands[command] = functionToHandle;
    }
    
    
    func setPort(port:UInt) throws {
        let docStartPath = NSBundle.mainBundle().pathForResource("document-start", ofType: "js", inDirectory: "js-dist")!;
        var documentStartJS = try NSString(contentsOfFile: docStartPath, encoding: NSUTF8StringEncoding) as String;
        
        documentStartJS = "var HANDLER_PORT = " + String(port) + ";\n" + documentStartJS;
        
        let userScript = WKUserScript(source: documentStartJS, injectionTime: .AtDocumentStart, forMainFrameOnly: true);
        userContentController.removeAllUserScripts();
        userContentController.addUserScript(userScript);
        
        
    }
    
}
