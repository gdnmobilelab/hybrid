//
//  HybridWebView.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import PromiseKit
import EmitterKit

struct HybridWebviewMetadata {
    var color:UIColor?
    var title:String
    var defaultBackURL:String?
    
    init() {
        title = ""
    }
}

class HybridWebview : WKWebView, WKNavigationDelegate {
    
    var console:ConsoleManager?
    var messageChannelManager:MessageChannelManager?
    var notificationPermissionHandler:NotificationPermissionHandler?
    var serviceWorkerAPI:ServiceWorkerAPI?
    var eventManager: EventManager?
    
    private static var activeWebviews = [HybridWebview]()
    
    // The easiest way I could find to connect these two together in a way that doesn't bind them - the
    // notification target doesn't include HybridWebView so we can't reference the class in WebviewClientManager
    
    static var webviewClientListener:Listener?
    
    func registerWebviewForServiceWorkerEvents() {
        if HybridWebview.activeWebviews.contains(self) {
            return
        }
        HybridWebview.activeWebviews.append(self)
        
        if HybridWebview.webviewClientListener == nil {
            
            // No idea why, but setting this as a static variable at the start doesn't work. We have to create it
            // later.
            
            HybridWebview.webviewClientListener = WebviewClientManager.clientEvents.on(HybridWebview.processClientEvent)
        }
        
        HybridWebview.saveWebViewRecords()
    }
    
    static func saveWebViewRecords() {
        
        // We need to save this somewhere that out-of-app code can still access it
        
 
        WebviewClientManager.currentWebviewRecords = HybridWebview.activeWebviews.enumerate().map { (idx, wv) in
            return WebviewRecord(
                url: wv.mappedURL,
                index: idx,
                workerId: wv.serviceWorkerAPI!.currentActiveServiceWorker?.instanceId
            )
        }

    }
    
    static func getActiveWebviewAtIndex(index:Int) -> HybridWebview {
        return self.activeWebviews[index]
    }
    
    
    func deregisterWebviewFromServiceWorkerEvents(hw: HybridWebview) {
        let idx = HybridWebview.activeWebviews.indexOf(hw)
        HybridWebview.activeWebviews.removeAtIndex(idx!)
    }
    
    static func processClientEvent(event:WebviewClientEvent) {
        if event.type == WebviewClientEventType.Claim {
            let webView = HybridWebview.activeWebviews[event.record!.index]
            
            ServiceWorkerInstance.getById(event.newServiceWorkerId!)
            .then { sw -> Void in
                webView.serviceWorkerAPI!.setNewActiveServiceWorker(sw!)
                saveWebViewRecords()
            }
        }
        else if event.type == WebviewClientEventType.Focus {
            let webView = HybridWebview.activeWebviews[event.record!.index]
            HybridNavigationController.current!.viewControllers.forEach { viewController in
                let asHybrid = viewController as! HybridWebviewController
                if asHybrid.webview == webView {
                    HybridNavigationController.current!.popToViewController(viewController, animated: true)
                }
            }
        }
    }
    
    static func clearRegisteredWebviews() {
        activeWebviews.removeAll()
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
        self.scrollView.contentInset = UIEdgeInsets(top: 0, left: 0, bottom: 0, right: 0)
        
        self.allowsLinkPreview = false
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
    
    func getMetadata() -> Promise<HybridWebviewMetadata> {
        return Promise<HybridWebviewMetadata> { fulfill, reject in
            self.evaluateJavaScript("var getMeta = function(name) { var t = document.querySelector(\"meta[name='\" + name + \"']\"); return t ? t.getAttribute('content') : null;}; [getMeta('theme-color'), document.title, getMeta('default-back-url')]", completionHandler: { (result, err) in
                if err != nil {
                    reject(err!)
                    return
                }
                
                let responses = result as! [AnyObject]
                
                var metadata = HybridWebviewMetadata()
                
                if let color = responses[0] as? String {
                    metadata.color = Util.hexStringToUIColor(color)
                }
                
                if let title = responses[1] as? String {
                    metadata.title = title
                }
                
                if let defaultBackURL = responses[2] as? String {
                    metadata.defaultBackURL = defaultBackURL
                }
                
                fulfill(metadata)
            })
        }
    }
    
    
    func webView(webView: WKWebView, decidePolicyForNavigationAction navigationAction: WKNavigationAction, decisionHandler: (WKNavigationActionPolicy) -> Void) {
        
        // If the URL falls within the scope of any service worker, we want to redirect the
        // browser to our local web server with the cached responses rather than the internet.
       
       
        let rewrittenURL = WebServerDomainManager.rewriteURLIfInWorkerDomain(navigationAction.request.URL!)
        
        if rewrittenURL == navigationAction.request.URL! {
            decisionHandler(WKNavigationActionPolicy.Allow)
            return
        }
        
        decisionHandler(WKNavigationActionPolicy.Cancel)
        webView.loadRequest(NSURLRequest(URL: rewrittenURL))

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
            
            if WebServerDomainManager.isLocalServerURL(currentURL!) {
                if currentURL?.path! == "/__placeholder" {
                    return nil
                }
                return WebServerDomainManager.mapServerURLToRequestURL(currentURL!)
            }
            
            // Otherwise just return it.
            
            return currentURL
        }
    }
}
