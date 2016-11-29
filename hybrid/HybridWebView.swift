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




/// Inherits from WKWebView, adds a few pieces of functionality we need, as well as tracking
/// of active webviews.
class HybridWebview : WKWebView, WKNavigationDelegate {
    
    var console:ConsoleManager?
    var messageChannelManager:MessageChannelManager?
    var notificationPermissionHandler:NotificationPermissionHandler?
    var serviceWorkerAPI:ServiceWorkerAPI?
    var eventManager: EventManager?
    
    
    /// A store for all the active webviews currently in use by the app
    private static var activeWebviews = [HybridWebview]()
    
    /// The WebviewClientManager and the HybridWebview can't be directly connected because the former exists
    /// in the notification extension, while the latter doesn't. So we use this listener to connect the two,
    /// when they're in the same environment. It is set by registerWebviewForServiceWorkerEvents()
    static var webviewClientListener:Listener?
    
    
    /// Registers this webview for things like WebviewClientManager events. Claim, postMessage, etc. Also
    /// sets the static webviewClientListener variable. For some reason EmitterKit doesn't let you
    /// declare a listener in the class directly, so instead we set it the first time we register a webview.
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
    
    
    /// Again for cross-process communication, we save a record of all the active webviews to UserDefaults.
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
    
    
    /// Active webviews are stored by index. This retreives based on that index.
    ///
    /// - Parameter index: index of webview to fetch
    /// - Returns: The hybrid webview at that index
    static func getActiveWebviewAtIndex(index:Int) -> HybridWebview {
        return self.activeWebviews[index]
    }
    
    
    /// When a worker exists the navigation stack (i.e. is returned to waiting area)
    /// we want to stop it from receiving any worker events.
    ///
    /// - Parameter hw: HybridWebview to remove
    static func deregisterWebviewFromServiceWorkerEvents(hw: HybridWebview) {
        let idx = HybridWebview.activeWebviews.indexOf(hw)
        HybridWebview.activeWebviews.removeAtIndex(idx!)
        saveWebViewRecords()
    }
    
    
    /// Takes events that were fired either in or out of process by a worker and runs them.
    /// Covers claim, focus, openWindow and postMessage events.
    ///
    /// - Parameter event: WebviewClientEvent, either applied directly or taken from UserDefaults storage
    static func processClientEvent(event:WebviewClientEvent) {
        if event.type == WebviewClientEventType.Claim {
            let webView = HybridWebview.activeWebviews[event.record!.index]
            
            ServiceWorkerInstance.getById(event.options!["newServiceWorkerId"] as! Int)
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
        else if event.type == WebviewClientEventType.OpenWindow {
            
            let url = NSURL(string: event.options!["urlToOpen"] as! String)
            
            HybridNavigationController.current!.pushNewHybridWebViewControllerFor(url!)
        
        } else if event.type == WebviewClientEventType.PostMessage {
            
            let webView = HybridWebview.activeWebviews[event.record!.index]
            
            // TODO: Do something about ports. We could handle then when we're in-process, but we
            // can't when we're in notification-content, and I don't want to implement inconsistent
            // behaviour.
            
            webView.serviceWorkerAPI!.handleIncomingPostMessage(event.options!["message"] as! String, ports: [])
            
            
        } else {
            log.error("Unrecognised event: " + String(event.type))
        }
    }
    
    
    /// Remove all registered webviews. Since this data is stored in UserDefaults it persists across
    /// app launches. We need to reset it on launch or we'll have stale data.
    static func clearRegisteredWebviews() {
        activeWebviews.removeAll()
    }
    
    
    init(frame: CGRect) {
        let config = WKWebViewConfiguration()
        config.userContentController = WKUserContentController()
        
        super.init(frame: frame, configuration: config)
        
        self.evaluateJavaScript("navigator.userAgent") { (userAgent, err) in
            self.customUserAgent = (userAgent as! String) + " hybridwebview"
            
        }
        
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
    
    
    /// Add the assistant library we have that adds support for navigator.serviceWorker and the like in the browser.
    ///
    /// - Parameter userController: userController to inject into
    /// - Throws: If the JS file cannot be read
    private func injectJS(userController: WKUserContentController) throws {
        let docStartPath = Util.appBundle().pathForResource("document-start", ofType: "js", inDirectory: "js-dist")!;
        let documentStartJS = try NSString(contentsOfFile: docStartPath, encoding: NSUTF8StringEncoding) as String;
     
        let userScript = WKUserScript(source: documentStartJS, injectionTime: .AtDocumentStart, forMainFrameOnly: true);
        userController.addUserScript(userScript)
    }
    
    
    /// Grab metadata from the current page. Inspects various tags in the <head>
    ///
    /// - Returns: A metadata struct with as much info as could be extracted
    func getMetadata() -> Promise<HybridWebviewMetadata> {
        return Promise<HybridWebviewMetadata> { fulfill, reject in
            self.evaluateJavaScript(WebviewJS.getMetadataJS, completionHandler: { (result, err) in
                if err != nil {
                    reject(err!)
                    return
                }
                
                let responses = result as! [AnyObject]
                
                var metadata = HybridWebviewMetadata()
                
                if let color = responses[0] as? String {
                    metadata.color = HexColor(hexString: color).toUIColor()
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
    
    
    /// Stops page loads for any URL that is under the scope of a service worker, which we want to load locallys
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
    
    
    /// Transform the raw URL into a remote URL, if it happens to be running on localhost. If not, just return the current URL
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
