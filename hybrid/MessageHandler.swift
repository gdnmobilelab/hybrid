//
//  MessageHandler.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit

class HybridMessageHandler : NSObject, WKScriptMessageHandler {
    
    var webviewConfiguration:WKWebViewConfiguration;
    private var userContentController:WKUserContentController;
    
    func userContentController(userContentController: WKUserContentController, didReceiveScriptMessage message: WKScriptMessage) {
        
        let bodyAsDict = message.body as! NSDictionary;
        let action = bodyAsDict["action"]! as! String;
        
        if (action == "log.error") {
            log.error(bodyAsDict["data"] as? String);
        }
        else if (action == "log.log" || action == "log.info") {
            log.info(bodyAsDict["data"] as? String);
        }
        
            
        else {
            // We don't know what this is
            print(bodyAsDict);
        }
    }
    
    override init() {
        webviewConfiguration = WKWebViewConfiguration();
        userContentController = WKUserContentController();
        
        webviewConfiguration.userContentController = userContentController;
        
        super.init();
        
        userContentController.addScriptMessageHandler(self, name: "hybrid");
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