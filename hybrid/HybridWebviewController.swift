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
    private var progressContext = 0
    private var lastObservedScrollViewHeight:CGFloat = 0
    private var isObserving = false
    
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
        
        self.view = WaitingArea.get()

        HybridWebview.registerWebviewForServiceWorkerEvents(self.webview)
        
        self.webview.navigationDelegate = self
        
        

        self.loadURL(urlToLoad)
    }
    
    func loadURL(urlToLoad:NSURL) {
        
        
        
        
        self.checkIfURLInsideServiceWorker(urlToLoad)
        .then { (url, sw) -> Promise<Void> in
            
            
            if self.webview.URL == nil || self.webview.URL!.host != "localhost" {
                self.webview.loadRequest(NSURLRequest(URL: url))
                return Promise<Void>()
            }
            
            
            let fr = FetchRequest(url: urlToLoad.absoluteString!, options: nil)
            
            return sw!.dispatchFetchEvent(fr)
            .then { response -> Promise<Void> in
                let responseAsString = String(data: response!.data!, encoding: NSUTF8StringEncoding)!
                
                let responseEscaped = responseAsString.stringByReplacingOccurrencesOfString("\"", withString: "\\\"")
                
                self.webview.scrollView.addObserver(self, forKeyPath: "contentSize", options: NSKeyValueObservingOptions(), context: &self.observeContext)
                self.webview.addObserver(self, forKeyPath: "estimatedProgress", options: NSKeyValueObservingOptions(), context: &self.progressContext)
                
                self.isObserving = true
                self.webview.evaluateJavaScript("__setHTML(\"" + responseEscaped + "\",\"" + url.absoluteString! + "\");", completionHandler: nil)
                self.webview.scrollView.contentOffset = CGPoint(x: 0,y: 0)
                
                //self.events.emit("ready", "test")
                return Promise<Void>()
            }
            
            
            
        }
        .error {err in
            self.webview.loadRequest(NSURLRequest(URL: urlToLoad))
        }
    }
    
    func checkIfURLInsideServiceWorker(url:NSURL) -> Promise<(NSURL,ServiceWorkerInstance?)> {
        return ServiceWorkerManager.getServiceWorkerForURL(url)
        .then { (serviceWorker) -> (NSURL,ServiceWorkerInstance?) in
            
            if (serviceWorker == nil) {
                
                // This is not inside any service worker scope, so allow
                
                return (url,nil)
            }
            
            return (WebServer.current!.mapRequestURLToServerURL(url), serviceWorker)
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
        let nav = self.navigationController
        if nav == nil {
            WaitingArea.add(self.webview)
            HybridWebview.deregisterWebviewFromServiceWorkerEvents(self.webview)
            self.webview.navigationDelegate = nil
            if self.isObserving == true {
                self.webview.scrollView.removeObserver(self, forKeyPath: "contentSize")
            }
            self.view = nil
            

        }
    }
    
    override func observeValueForKeyPath(keyPath: String?, ofObject object: AnyObject?, change: [String : AnyObject]?, context: UnsafeMutablePointer<Void>) {
        if (keyPath == "contentSize") {
            let newHeight = self.webview.scrollView.contentSize.height
            
            NSLog("New height: " + String(self.webview.scrollView.contentSize.height))
            NSLog("New area:" + String(self.webview.frame.height))
            
            if newHeight >= self.webview.frame.height {
                
                let triggerTime = (Double(NSEC_PER_SEC) * 0.12)
                dispatch_after(dispatch_time(DISPATCH_TIME_NOW, Int64(triggerTime)), dispatch_get_main_queue(), { () -> Void in
//                    self.events.emit("ready", "test")
                })
                
                
                self.webview.scrollView.removeObserver(self, forKeyPath: "contentSize")
                self.isObserving = false
            }

        }
        if self.view != nil {
            if self.webview.estimatedProgress == 1 {
                self.events.emit("ready", "test")
            }
            NSLog("Progress? " + String(self.webview.estimatedProgress))
        }
        
        
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
        
        
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
}
