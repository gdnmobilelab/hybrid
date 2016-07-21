//
//  HybridWebView.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit

class HybridWebview : WKWebView, WKNavigationDelegate {
    
    override init(frame: CGRect, configuration: WKWebViewConfiguration) {
        super.init(frame: frame, configuration: configuration)
        self.navigationDelegate = self
    }
    
    func webView(webView: WKWebView, decidePolicyForNavigationAction navigationAction: WKNavigationAction, decisionHandler: (WKNavigationActionPolicy) -> Void) {
       
        let urlForRequest = navigationAction.request.URL!
            
        if urlForRequest.host == "localhost" && urlForRequest.port == WebServer.current!.port {
            // Is already a request to our local web server, so allow
            decisionHandler(WKNavigationActionPolicy.Allow)
            return
        }
        
        ServiceWorkerManager.getServiceWorkerForURL(navigationAction.request.URL!)
        .then { (serviceWorker) -> Void in
            
            if (serviceWorker == nil) {
                
                // This is not inside any service worker scope, so allow
                
                decisionHandler(WKNavigationActionPolicy.Allow)
                return
            }
            
            let mappedURL = try serviceWorker!.getURLInsideServiceWorkerScope(navigationAction.request.URL!)
            decisionHandler(WKNavigationActionPolicy.Cancel)
            webView.loadRequest(NSURLRequest(URL: mappedURL))
            
        }
        .error { err in
            log.error(String(err))
            decisionHandler(WKNavigationActionPolicy.Allow)
            
        }
        
       
    }
}