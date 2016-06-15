//
//  MessageHandler.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit

typealias Callback = (returnValue:AnyObject?) -> Void


class HybridMessageHandler : NSObject, WKScriptMessageHandler {
    
    typealias MessageCommand = (arguments:AnyObject, callback: Callback?) -> Void
    
    var webviewConfiguration:WKWebViewConfiguration;
    private var userContentController:WKUserContentController;
    
    private var registeredCommands = Dictionary<String, MessageCommand>();
    
    func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        
        let command = message.body["command"] as! String;
        let arguments = message.body["arguments"];
        
        if (registeredCommands[command] == nil) {
            log.error("Webview called command " + command + " but it isn't registered.");
        }
        
        // We need a way to pass data back into the webview. WKWebView doesn't have anything built in for this
        // so instead the JS library declares a function on the window object that we manually call to provide
        // the relevant data.
        
        var callback: Callback? = nil;
        let callbackID = message.body["_callbackIndex"] as? Int;
        
        if callbackID != nil {
            callback = { r in
                log.info("test");
                let js = "window._hybridCallback(" + String(callbackID!) + ",null,'test');";
                message.webView!.evaluateJavaScript(js, completionHandler: nil)
            }
        }
        
        
        registeredCommands[command]!(arguments: arguments!!, callback: callback);
        
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