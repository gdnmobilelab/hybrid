//
//  HybridWebviewConfiguration.swift
//  hybrid
//
//  Created by alastair.coote on 15/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import HybridShared

class HybridWebviewConfiguration : WKWebViewConfiguration {
    
    let messageHandler = HybridMessageManager()
    
    override init() {
        super.init()
        self.allowsAirPlayForMediaPlayback = true
        self.allowsInlineMediaPlayback = true
        self.allowsPictureInPictureMediaPlayback = true
        //        config.applicationNameForUserAgent = "hybridwebview/" + (SharedResources.appBundle.infoDictionary!["CFBundleShortVersionString"] as! String)
        
        self.userContentController = WKUserContentController()
        self.userContentController.add(self.messageHandler, name: "hybrid")
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func createScripts(registerCommands: [RegisterItemCommand]) {
        
        let registerCommands = registerCommands.map { $0.getPayload() }
        dump(registerCommands)
        do {
            
            let serialized = try ReturnSerializer.serializeToJSON(registerCommands, manager: self.messageHandler)
            
            let commandsScript = WKUserScript(source: "var __hybridRegisterCommands = \(serialized);", injectionTime: WKUserScriptInjectionTime.atDocumentStart, forMainFrameOnly: false)
            let docStartScript = try self.createDocumentStartScript()
            
            self.userContentController.addUserScript(commandsScript)
            self.userContentController.addUserScript(docStartScript)
            
        } catch {
            
            log.error("Could not set webview scripts: " + String(describing: error))
            
        }
        
    }
    
    /// This user script is the bundled source from js-src that is called on every page load.
    fileprivate func createDocumentStartScript() throws -> WKUserScript {
        
        let bundle = Bundle(for: HybridWebviewConfiguration.self)
        let docStartPath = bundle.path(forResource: "document-start", ofType: "js", inDirectory: "js-dist")!
        let js = try String(contentsOfFile: docStartPath, encoding: String.Encoding.utf8)
        
        return WKUserScript(source: js, injectionTime: .atDocumentStart, forMainFrameOnly: false)
    }

    
}
