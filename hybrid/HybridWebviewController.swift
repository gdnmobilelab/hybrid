//
//  HybridWebviewController.swift
//  hybrid
//
//  Created by alastair.coote on 25/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import EmitterKit
import PromiseKit
import WebKit

class HybridWebviewController : UIViewController, WKNavigationDelegate {
    
    private var observeContext = 0
    private var lastObservedScrollViewHeight:CGFloat = 0
    
    var currentMetadata:HybridWebviewMetadata?
    
    private enum LoadState {
        case InitialRequest
        case BeneathInitialSize
        case PossiblyReady
    }
    
    let events = Event<AnyObject>()
    private var loadState:LoadState
    
    var webview:HybridWebview {
        get {
            return self.view as! HybridWebview
        }
    }
    
    let hybridNavigationController:HybridNavigationController
    
    init(urlToLoad:NSURL, navController: HybridNavigationController) {
        self.loadState = LoadState.InitialRequest
        self.hybridNavigationController = navController
        super.init(nibName: nil, bundle: nil)
     
        self.lastObservedScrollViewHeight = self.view.frame.height
        
        if navController.availableWebViewPool.count > 0 {
            self.view = navController.availableWebViewPool.removeFirst()
        } else {
            self.view = HybridWebview(frame: self.view.frame)
        }
        
        HybridWebview.registerWebviewForServiceWorkerEvents(self.webview)
        
        self.webview.navigationDelegate = self
        
//        self.webview.scrollView.addObserver(self, forKeyPath: "contentSize", options: NSKeyValueObservingOptions(), context: &self.observeContext)
        
        self.checkIfURLInsideServiceWorker(urlToLoad)
        .then { url -> Void in
            self.webview.loadRequest(NSURLRequest(URL: url))
        }
        
    }
    
    func checkIfURLInsideServiceWorker(url:NSURL) -> Promise<NSURL> {
        return ServiceWorkerManager.getServiceWorkerForURL(url)
        .then { (serviceWorker) -> NSURL in
            
            if (serviceWorker == nil) {
                
                // This is not inside any service worker scope, so allow
                
                return url
            }
            
            return WebServer.current!.mapRequestURLToServerURL(url)
        }

    }
    
    func webView(webView: WKWebView, decidePolicyForNavigationAction navigationAction: WKNavigationAction, decisionHandler: (WKNavigationActionPolicy) -> Void) {
        
        if navigationAction.navigationType != WKNavigationType.LinkActivated {
            decisionHandler(WKNavigationActionPolicy.Allow)
            return
        }
        
        var intendedURL = navigationAction.request.URL!
        
        if WebServer.current!.isLocalServerURL(intendedURL) {
            intendedURL = WebServer.checkServerURLForReferrer(navigationAction.request.URL!, referrer: navigationAction.request.allHTTPHeaderFields!["Referer"])
            intendedURL = WebServer.mapServerURLToRequestURL(intendedURL)
        }
        
        
        self.hybridNavigationController.pushNewHybridWebViewControllerFor(intendedURL)
        decisionHandler(WKNavigationActionPolicy.Cancel)
    }
    
    func webView(webView: WKWebView, didFinishNavigation navigation: WKNavigation!) {
        
        self.webview.getMetadata()
        .then { metadata -> Void in
            self.currentMetadata = metadata
            self.title = metadata.title
            self.events.emit("ready", "test")

        }
        
    }
    
    override func preferredStatusBarStyle() -> UIStatusBarStyle {
        return UIStatusBarStyle.LightContent
    }
    
    override func viewDidDisappear(animated: Bool) {
        
        super.viewDidDisappear(animated)
        
        if self.isMovingToParentViewController() {
            self.hybridNavigationController.availableWebViewPool.append(self.webview)
            HybridWebview.deregisterWebviewFromServiceWorkerEvents(self.webview)
            self.webview.navigationDelegate = nil
            self.view = nil
        }
    }
    
    override func observeValueForKeyPath(keyPath: String?, ofObject object: AnyObject?, change: [String : AnyObject]?, context: UnsafeMutablePointer<Void>) {
       
        let newHeight = self.webview.scrollView.contentSize.height
        
        
//        if self.loadState == LoadState.InitialRequest && newHeight < self.lastObservedScrollViewHeight {
//            self.loadState = LoadState.BeneathInitialSize
////            self.lastObservedScrollViewHeight = newHeight
//        } else if self.loadState == LoadState.BeneathInitialSize && newHeight > self.lastObservedScrollViewHeight {
//            self.loadState = LoadState.PossiblyReady
////            
//            self.webview.scrollView.removeObserver(self, forKeyPath: "contentSize")
//            
//            NSLog("Pushing view")
//            self.events.emit("ready", "test")
//        }
//        
//        self.lastObservedScrollViewHeight = newHeight
        
        NSLog("New height: " + String(self.webview.scrollView.contentSize.height))
        NSLog("New area:" + String(self.webview.frame.height))
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
}
