//
//  HybridWebview.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import HybridShared
import PromiseKit
import HybridWorkerManager

public class HybridWebview : WKWebView {
    
    let events = EventEmitter<Void>()
    let hybridConfiguration = HybridWebviewConfiguration()
//    var _context: HybridWebviewContext?
    let container: HybridUIContainer
    
    
    /// Silly to have this, but the way Swift initializers work, we can't make it non-optional.
//    fileprivate var context: HybridWebviewContext {
//        get {
//            return self._context!
//        }
//    }
    
    public init(container: HybridUIContainer) {
        
        self.container = container
        
        super.init(frame: CGRect(x: 0, y: 0, width: 0, height: 0), configuration: self.hybridConfiguration)
        
        hybridConfiguration.messageHandler.webview = self
        hybridConfiguration.createScripts()
    }
    
    required public init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func loadURL(_ url: URL) {
        self.events.emit("navigate", ())
        self.load(URLRequest(url: url))
    }
    
    
    /// This is mostly used for testing
    override public func loadHTMLString(_ string: String, baseURL: URL?) -> WKNavigation? {
        return super.loadHTMLString(string, baseURL: baseURL)
    }
    
    func dispatchEventToConnectedItem(item: HybridMessageReceiver, eventType: String, data: Any?) {
        
        let cmd = ItemEventCommand(target: item, eventName: eventType, data: data)
        
        self.hybridConfiguration.messageHandler.sendCommand(cmd)
    }

    
    func evaluateJavaScriptAndCatchError(_ js:String) -> Promise<Any?> {
        return Promise(resolvers: { (resolve, reject) in
            
            self.evaluateJavaScript(js, completionHandler: { (response, error) in
                if error != nil {
                    reject(error!)
                } else {
                    resolve(response)
                }
            })
            
        })

    }
    
}
