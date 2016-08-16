//
//  WebviewClientManager.swift
//  hybrid
//
//  Created by alastair.coote on 16/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

@objc protocol WebviewClientManagerExports : JSExport {
    func claim(callback:JSValue)
}

@objc class WebviewClientManager : NSObject, WebviewClientManagerExports {
    
    let serviceWorker:ServiceWorkerInstance
    
    func claim(callback:JSValue) {
        
        // Allows a worker to take control of clients within its scope.

        for webview in HybridWebview.activeWebviews {
            // Only claim workers within scope
            if webview.mappedURL!.absoluteString.hasPrefix(self.serviceWorker.scope.absoluteString) {
                webview.serviceWorkerAPI!.setNewActiveServiceWorker(self.serviceWorker)
            }
        }
        
        callback.callWithArguments([])
    }
    
    required init(serviceWorker:ServiceWorkerInstance) {
        self.serviceWorker = serviceWorker
    }
}