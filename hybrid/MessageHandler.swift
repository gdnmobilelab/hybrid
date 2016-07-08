//
//  MessageHandler.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import PromiseKit

typealias Callback = (returnError: AnyObject?, returnValue:AnyObject?) -> Void

struct HybridWebviewMessage {
    let command:String
    let argumentsJSON:String?
    let callbackIndex:Int?
    let webviewURL:NSURL
    
    init(args:AnyObject, webviewURL: NSURL) {
        self.command = args["command"] as! String
        self.argumentsJSON = args["arguments"] as? String
        self.callbackIndex = args["_callbackIndex"] as? Int
        self.webviewURL = webviewURL
    }
}


class HybridMessageHandler : NSObject, WKScriptMessageHandler {
    
    typealias MessageCommand = (arguments:String, webviewURL: NSURL ) -> Promise<AnyObject>
    
    var webviewConfiguration:WKWebViewConfiguration;
    private var userContentController:WKUserContentController;
    
    private var registeredCommands = Dictionary<String, MessageCommand>();
    
    func anyObjectToJSON(obj:AnyObject) throws -> String {
        
        if (obj is String) {
            let objString = obj as! String
            return "\"" + objString + "\"";
        }
        
        if (obj is Bool) {
            return (obj as! Bool) == true ? "true" : "false"
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
        
        
        
        let commandPromise = registeredCommands[args.command]!(arguments: args.argumentsJSON!, webviewURL: currentWebviewURL)
        
        if (args.callbackIndex == nil) {
            return
        }
        
        // We need a way to pass data back into the webview. WKWebView doesn't have anything built in for this
        // so instead the JS library declares a function on the window object that we manually call to provide
        // the relevant data.
        
        commandPromise.then { (result) -> Void in
            
            let returnJSON = try self.anyObjectToJSON(result)
            let js = "window._hybridCallback(" + String(args.callbackIndex!) + ",null," + returnJSON + ");";
            message.webView!.evaluateJavaScript(js, completionHandler: nil)
            
        }.error { (err) -> Void in
            
            let js = "window._hybridCallback(" + String(args.callbackIndex!) + "," + String(err) + ");";
            message.webView!.evaluateJavaScript(js, completionHandler: nil)

        }
        
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
