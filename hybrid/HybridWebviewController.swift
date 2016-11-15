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
    
    var currentMetadata:HybridWebviewMetadata?
    
    
    let events = Event<HybridWebviewController>()
    
    var webview:HybridWebview? {
        get {
            return self.view as? HybridWebview
        }
    }
    
   
//    let hybridNavigationController:HybridNavigationController
    
    var hybridNavigationController:HybridNavigationController? {
        get {
            return self.navigationController as? HybridNavigationController
        }
    }
    
    var isReady = false

    
    init() {
        super.init(nibName: nil, bundle: nil)
        
        self.view = HybridWebview(frame: self.view.frame)

        self.webview!.registerWebviewForServiceWorkerEvents()
        
        self.webview!.navigationDelegate = self
        
        // Don't show text in back button - it's causing some odd display problems
        self.navigationItem.backBarButtonItem = UIBarButtonItem(title: "", style: .Plain, target: nil, action: nil)
        
    }
    
    
    func loadURL(urlToLoad:NSURL, attemptAcceleratedLoading:Bool) {
        
        if urlToLoad.host == "localhost" {
            log.error("Should never directly load a localhost URL - should be a server URL")
        }
        
        self.isReady = false
        
        let startRequestTime = NSDate().timeIntervalSince1970
        
        self.events.once("ready", { _ in
            self.isReady = true
            
            let readyTime = NSDate().timeIntervalSince1970
            
            log.info("LOADED IN " + String(readyTime - startRequestTime))
            
            // Because the URL is likely to have changed, we need to re-save our records to keep them accurate.
            HybridWebview.saveWebViewRecords()
        })
        
        Promise<Void>()
        .then { () -> Promise<Void> in
            
            let maybeRewrittenURL = WebServerDomainManager.rewriteURLIfInWorkerDomain(urlToLoad)
            
            let loadNormally = { () -> Promise<Void> in
                log.info("Loading " + maybeRewrittenURL.absoluteString! + " normally")
                self.webview!.loadRequest(NSURLRequest(URL: maybeRewrittenURL))
                return Promise<Void>()
            }
            
            // Cutting out the idea of accelerated loading for now - it doesn't actually
            // seem to deliver any loading benefit any more! Leaving the code in so that
            // we can re-enable it if ever necessary - perhaps as pages get more complex?
            
            return loadNormally()
            
            // COMMENTED: ACCELERATED LOAD
            
//            if attemptAcceleratedLoading == false {
//                
//                // This direct injecting of HTML seems to have issues that are difficult
//                // to track down. So we're using it sparingly - only when a user taps and
//                // we're pushing a new view into the stack. For loading in the background
//                // we'll just use normal load.
//                
//                return loadNormally()
//            }
//            
//            if maybeRewrittenURL == urlToLoad {
//                // Is not within a service worker domain, so we can just load it
//                return loadNormally()
//            }
//            
//            let currentWebviewURL = self.webview!.URL
//
//            if currentWebviewURL == nil || currentWebviewURL!.host != "localhost" || self.webview!.URL!.port != maybeRewrittenURL.port || currentWebviewURL!.path!.containsString("__placeholder") == false ||
//                maybeRewrittenURL.path!.containsString("__placeholder") == true {
//                
//                // Placeholder stuff requires us to be on the same domain, and on a placeholder page. If any
//                // of this isn't true - or if we're *loading* a placeholder page, skip
//                
//                return loadNormally()
//            }
//            
//            // If none of the above is true then we're on a service worker-enabled domain. This
//            // doesn't *necessarily* mean we're in a service worker scope, but either way we can
//            // make a request same as the browser would, then inject the content.
//            
//            log.info("Attempting to load " + maybeRewrittenURL.absoluteString! + " accelerated")
//
//            
//            let request = FetchRequest(url: maybeRewrittenURL.absoluteString!, options: nil)
//            return GlobalFetch.fetchRequest(request)
//            .then { response in
//                
//                let responseAsString = String(data: response.data!, encoding: NSUTF8StringEncoding)!
//                let responseEscaped = responseAsString.stringByReplacingOccurrencesOfString("\"", withString: "\\\"")
//                
//                return Promise<Void> { fulfill, reject in
//                    self.webview!.evaluateJavaScript("__setHTML(\"" + responseEscaped + "\",\"" + maybeRewrittenURL.absoluteString! + "\");__addLoadedIndicator();",completionHandler: { (obj:AnyObject?, err: NSError?) in
//                        if err != nil {
//                            // Injecting HTML failed. Why?
//                            
//                            reject(err!)
//                        } else {
//                            fulfill()
//                        }
//                    })
//                }
//            }
//            .then { () -> Promise<Void> in
//                
//                return when(
//                    self.waitForRendered(),
//                    self.setMetadata()
//                )
//                
//            }
//            .then { () -> Void in
//                self.events.emit("ready", self)
//            }
//            .recover { err -> Void in
//                log.error(String(err))
//                loadNormally()
//            }

        }
        
    }
    
    func prepareHeaderControls(alreadyHasBackControl:Bool) {
        
        // We've included the ability for webviews to specify a default "back" URL, but if
        // we already have a back control then we don't need to use it.
        
//        if alreadyHasBackControl == true || self.currentMetadata?.defaultBackURL == nil {
//            self.navigationItem.leftBarButtonItem = nil
//            return
//        }
//        
//        let backTo = BackButtonSymbol(onTap: self.popToCustomBackWebView)
//        backTo.sizeToFit()
//        let back = UIBarButtonItem(customView: backTo)
//        self.navigationItem.leftBarButtonItem = back
    }
    
//    func popToCustomBackWebView() {
//        let relativeURL = NSURL(string: self.currentMetadata!.defaultBackURL!, relativeToURL: self.webview!.URL!)!
//        self.hybridNavigationController!.popToNewHybridWebViewControllerFor(relativeURL)
//    }
    
    func fiddleContentInsets() {
        
        // No idea why, but when pushing a viewcontroller in from the staging area the insets sometimes
        // get messed up. Resetting them on push seems to work, though.
        
        self.webview!.scrollView.contentInset = UIEdgeInsets(top: 1, left: 0, bottom: 0, right: 0)
    }
    
    
    func webView(webView: WKWebView, decidePolicyForNavigationAction navigationAction: WKNavigationAction, decisionHandler: (WKNavigationActionPolicy) -> Void) {
        
        if navigationAction.navigationType != WKNavigationType.LinkActivated {
            decisionHandler(WKNavigationActionPolicy.Allow)
            return
        }
        
        var intendedURL = navigationAction.request.URL!
        
        
        if WebServerDomainManager.isLocalServerURL(intendedURL) {
            intendedURL = WebServerDomainManager.mapServerURLToRequestURL(intendedURL)
        }
        
        if navigationAction.targetFrame == nil {
            // been called with _blank
            UIApplication.sharedApplication().openURL(intendedURL, options: [:], completionHandler: { (success) in
                log.info("Attempt to open URL: " + intendedURL.absoluteString! + " resulted in:" + String(success))
            })
        } else {
            self.hybridNavigationController!.pushNewHybridWebViewControllerFor(intendedURL)
        }
        decisionHandler(WKNavigationActionPolicy.Cancel)
    }
    
    func webView(webView: WKWebView, didFinishNavigation navigation: WKNavigation!) {
        
        Promise<Void> { fulfill, reject in
            self.webview!.evaluateJavaScript(WebviewJS.setLoadingIndicator, completionHandler: { (obj:AnyObject?, err: NSError?) in
                if err != nil {
                    // Injecting HTML failed. Why?
                    
                    reject(err!)
                } else {
                    fulfill()
                }
            })

        }
        .then {
            return when(
                self.waitForRendered(),
                self.setMetadata()
            )
        }
        .then {
            self.events.emit("ready", self)
        }
        .recover { err in
            self.events.emit("ready", self)
        }
    }
    
    func setMetadata() -> Promise<Void> {
        return self.webview!.getMetadata()
        .then { metadata -> Void in
            self.currentMetadata = metadata
            
        }
    }
    
    override func viewWillAppear(animated: Bool) {
        super.viewWillAppear(animated)
        // Need this otherwise the title sometimes disappears
        if self.hybridNavigationController != nil && self.currentMetadata != nil {
            self.navigationItem.title = self.currentMetadata!.title
        }
    }
    
    override func preferredStatusBarStyle() -> UIStatusBarStyle {
        return UIStatusBarStyle.LightContent
    }
    
    override func viewDidDisappear(animated: Bool) {
        
        super.viewDidDisappear(animated)
        
        if self.navigationController == nil {
            HybridWebview.deregisterWebviewFromServiceWorkerEvents(self.webview!)
            self.events.emit("popped", self)
        }
        
    }
    
    var renderCheckContext:CGContext?
    var pixel:UnsafeMutablePointer<CUnsignedChar>?
    
    func checkIfRendered() -> Bool {
        
        // Because WKWebView lives on a separate process, it's very difficult to guarantee when
        // rendering has actually happened. To avoid the flash of white when we push a controller,
        // we take a width * 1px screenshot, and detect a dummy pixel we've put in the top right of
        // the page in a custom color. If it isn't detected, waitForRender() fires again at the next
        // interval.
        
        let height = 1
        let width = Int(self.view.frame.width)
        
        if self.renderCheckContext == nil {
            
            self.pixel = UnsafeMutablePointer<CUnsignedChar>.alloc(4 * width * height)
            let colorSpace = CGColorSpaceCreateDeviceRGB()
            let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.PremultipliedLast.rawValue)
            self.renderCheckContext = CGBitmapContextCreate(pixel!, width, height, 8, width * 4, colorSpace, bitmapInfo.rawValue)!
        }
        

        self.webview!.scrollView.layer.renderInContext(self.renderCheckContext!)
        
        let startAt = 4 * width * height - 4
        
        let red = CGFloat(pixel![startAt])
        let green = CGFloat(pixel![startAt + 1])
        let blue =  CGFloat(pixel![startAt + 2])
//        let alpha = CGFloat(pixel![startAt + 3])
        
       
//        
//        
//        let imgref = CGBitmapContextCreateImage(self.renderCheckContext!)
//        let uiImage = UIImage(CGImage: imgref!)

//        if self.tempCheckView == nil {
//            self.tempCheckView = UIImageView(image: uiImage)
//            self.tempCheckView?.alpha = 0.7
//            AppDelegate.window!.addSubview(UIImageView(image: uiImage))
//        } else {
//            self.tempCheckView?.image = uiImage
//        }
        
        return red == 0 && blue == 255 && green == 255
    }
    
    private var tempCheckView:UIImageView?
    
    
    private func waitRenderWithFulfill(fulfill: () -> ()) {
        if self.checkIfRendered() == true {
            log.debug("Checked if webview was ready, it WAS")
            self.renderCheckContext = nil
            self.pixel!.destroy()
            self.pixel = nil
            
            if self.tempCheckView != nil {
                self.tempCheckView!.removeFromSuperview()
            }
            
            self.webview!.evaluateJavaScript(WebviewJS.removeLoadingIndicator, completionHandler: nil)
            fulfill()
        } else {
            log.debug("Checked if webview was ready, it was not")
            let triggerTime = (Double(NSEC_PER_SEC) * 0.05)
            dispatch_after(dispatch_time(DISPATCH_TIME_NOW, Int64(triggerTime)), dispatch_get_main_queue(), { () -> Void in
                self.waitRenderWithFulfill(fulfill)
            })
        }
    }
    
    func waitForRendered() -> Promise<Void> {
        return Promise<Void> { fulfill, reject in
            self.waitRenderWithFulfill(fulfill)
        }
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
}
