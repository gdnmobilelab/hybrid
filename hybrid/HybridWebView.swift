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
    
    var console:ConsoleManager?
    var messageChannelManager:MessageChannelManager?
    var notificationPermissionHandler:NotificationPermissionHandler?
    var serviceWorkerAPI:ServiceWorkerAPI?
    var eventManager: EventManager?
    
    private static var activeWebviews = [HybridWebview]()
    
    static func registerWebviewForServiceWorkerEvents(hw:HybridWebview) {
        self.activeWebviews.append(hw);
    }
    
    static func clearRegisteredWebviews() {
        activeWebviews.removeAll()
    }
    
    static func claimWebviewsForServiceWorker(sw:ServiceWorkerInstance) {
        
        let applicableWebviews = HybridWebview.activeWebviews.filter({ hw in
            return hw.mappedURL!.absoluteString!.hasPrefix(sw.scope.absoluteString!)
        })
        
        if applicableWebviews.count == 0 {
            log.warning("Didn't find any webviews to claim for: " + sw.scope.absoluteString!)
        }
        
        for webview in applicableWebviews {
            // Only claim workers within scope
            if webview.mappedURL!.absoluteString!.hasPrefix(sw.scope.absoluteString!) {
                webview.serviceWorkerAPI!.setNewActiveServiceWorker(sw)
            }
        }
    }
    
    init(frame: CGRect) {
        let config = WKWebViewConfiguration()
        config.userContentController = WKUserContentController()
        
        super.init(frame: frame, configuration: config)
        
        do {
            try self.injectJS(config.userContentController)

        } catch {
            // Don't really know what we'd do at this point
            log.error(String(error))
        }
        self.console = ConsoleManager(userController: config.userContentController, webView: self)
        self.messageChannelManager = MessageChannelManager(userController: config.userContentController, webView: self)
        self.notificationPermissionHandler = NotificationPermissionHandler(userController: config.userContentController, webView: self)
        self.serviceWorkerAPI = ServiceWorkerAPI(userController: config.userContentController, webView: self)
        self.eventManager = EventManager(userController: config.userContentController, webView: self)
        self.navigationDelegate = self
        
        // For testing mimicking Chrome - to remove!
        self.customUserAgent = "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.23 Mobile Safari/537.36"
        
    }

    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func injectJS(userController: WKUserContentController) throws {
        let docStartPath = NSBundle.mainBundle().pathForResource("document-start", ofType: "js", inDirectory: "js-dist")!;
        let documentStartJS = try NSString(contentsOfFile: docStartPath, encoding: NSUTF8StringEncoding) as String;
     
        let userScript = WKUserScript(source: documentStartJS, injectionTime: .AtDocumentStart, forMainFrameOnly: true);
        userController.addUserScript(userScript)
    }
    
    func webView(webView: WKWebView, decidePolicyForNavigationAction navigationAction: WKNavigationAction, decisionHandler: (WKNavigationActionPolicy) -> Void) {
        
        // If the URL falls within the scope of any service worker, we want to redirect the
        // browser to our local web server with the cached responses rather than the internet.
       
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
            
            let mappedURL = WebServer.current!.mapRequestURLToServerURL(navigationAction.request.URL!)
//            try serviceWorker!.getURLInsideServiceWorkerScope(navigationAction.request.URL!)
            decisionHandler(WKNavigationActionPolicy.Cancel)
            webView.loadRequest(NSURLRequest(URL: mappedURL))
            
        }
        .error { err in
            log.error(String(err))
            decisionHandler(WKNavigationActionPolicy.Allow)
            
        }
    }
    
    var mappedURL:NSURL? {
        get {
            let currentURL = self.URL
            if currentURL == nil {
                return nil
            }
            
            if currentURL!.scheme == "about" {
                return nil
            }
            // If it's a local URL for a service worker, map it
            
            if currentURL!.host! == "localhost" && currentURL!.port! == WebServer.current?.port {
                return WebServer.mapServerURLToRequestURL(currentURL!)
            }
            
            // Otherwise just return it.
            
            return currentURL
        }
    }
}