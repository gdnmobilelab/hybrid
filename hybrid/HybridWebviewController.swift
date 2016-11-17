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

    
/// Controller for our HybridWebView, with a number of additional features like swapping out remote URLs for
/// local ones when within a worker context, as well as consuming page metadata and changing navigation controls
/// accordingly.
class HybridWebviewController : UIViewController, WKNavigationDelegate {
    
    var currentMetadata:HybridWebviewMetadata?
    
    let events = Event<HybridWebviewController>()
    
    var webview:HybridWebview? {
        get {
            return self.view as? HybridWebview
        }
    }
    
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
    
    
    /// Loads a new URL into the webview. Handles mapping to a local URL when inside a worker context,
    /// and also tracks page load time for logging purposes
    ///
    /// - Parameter urlToLoad: The full, remote URL we want to load. Do not pass in a URL already mapped to localhost.
    func loadURL(urlToLoad:NSURL) {
        
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
        
        let maybeRewrittenURL = WebServerDomainManager.rewriteURLIfInWorkerDomain(urlToLoad)
        
        log.info("Loading " + maybeRewrittenURL.absoluteString!)
        self.webview!.loadRequest(NSURLRequest(URL: maybeRewrittenURL))
        
    }
    
    
    /// Right now there is a flash of the back button when we manually add a view behind the current one.
    /// There's code here for adding a back button manually, but it stops back swiping from working, so it's
    /// commented out for now.
    func prepareHeaderControls(alreadyHasBackControl:Bool) {
        
        // We've included the ability for webviews to specify a default "back" URL, but if
        // we already have a back control then we don't need to use it.
        
//        if alreadyHasBackControl == true || self.currentMetadata?.defaultBackURL == nil {
//            self.navigationItem.leftBarButtonItem = nil
//            return
//        }
//        
//        let backTo = BackButtonSymbol(onTap: self.popThisView)
//        backTo.sizeToFit()
//        let back = UIBarButtonItem(customView: backTo)
//        self.navigationItem.leftBarButtonItem = back
    }
    
    func popThisView() {
        self.hybridNavigationController!.popViewControllerAnimated(true)
    }
    
//    func fiddleContentInsets() {
//        
//        // No idea why, but when pushing a viewcontroller in from the staging area the insets sometimes
//        // get messed up. Resetting them on push seems to work, though.
//        
//        self.webview!.scrollView.contentInset = UIEdgeInsets(top: 1, left: 0, bottom: 0, right: 0)
//    }
    
    
    /// Intercepts attempts to link to a new URL. If it's not a link navigation we allow it, otherwise we
    /// cancel. If it's a link with the target=_blank then we pass out to the URL (assuming it's an offsite
    /// link), otherwise we push a new navigation controller for the URL into our view stack.
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
    
    
    /// When the page has finished loading we grab the metadata and run our render checker to make sure
    /// the page is visible before we push it into our stack.
    func webView(webView: WKWebView, didFinishNavigation navigation: WKNavigation!) {
        
        let w:Promise<Void> = when([
            self.waitForRendered(),
            self.setMetadata()
        ])
        
        return w.then { () -> Void in
            self.events.emit("ready", self)
        }
        .error { err in
            log.error(String(err))
            // even if these fail we should just show the view
            self.events.emit("ready", self)
        }
    }
    
    
    /// Grab the metadata from the current page and store in self.currentMetadata
    ///
    /// - Returns: A Promise that resolves when the JS evaluates
    func setMetadata() -> Promise<Void> {
        return self.webview!.getMetadata()
        .then { metadata -> Void in
            self.navigationItem.title = metadata.title
            self.currentMetadata = metadata
            
        }
    }
    
    
    /// Preferred status bar style is lightcontent, but at some point need to add the
    /// ability to flip to dark if the navigation bar has a light background.
    override func preferredStatusBarStyle() -> UIStatusBarStyle {
        return UIStatusBarStyle.LightContent
    }
    
    
    /// If disappearing because we've been popped from the navigation controller, then
    /// unregister from service worker events, and emit a "popped" event, allowing this
    /// view to be reinserted into the waiting area.
    override func viewDidDisappear(animated: Bool) {
        
        super.viewDidDisappear(animated)
        
        if self.navigationController == nil {
            HybridWebview.deregisterWebviewFromServiceWorkerEvents(self.webview!)
            self.events.emit("popped", self)
        }
        
    }
    
    
    /// Use the RenderCheck class to wait for the view paint to be visible on screen
    ///
    /// - Returns: A promise that resolves when the paint is detected as successful.
    func waitForRendered() -> Promise<Void> {
        let renderCheck = RenderCheck(target: self.webview!)
        return Promise<Void> { fulfill, reject in
            renderCheck.waitForRender(fulfill)
        }
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
}
