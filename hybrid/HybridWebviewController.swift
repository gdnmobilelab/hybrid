    //
//  HybridWebviewController.swift
//  hybrid
//
//  Created by alastair.coote on 25/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import PromiseKit
import WebKit

    
/// Controller for our HybridWebView, with a number of additional features like swapping out remote URLs for
/// local ones when within a worker context, as well as consuming page metadata and changing navigation controls
/// accordingly.
class HybridWebviewController : UIViewController, WKNavigationDelegate, WKUIDelegate {
    
    var currentMetadata:HybridWebviewMetadata?
    
    let events = EventEmitter<HybridWebviewController>()
    
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

    let titleTextView:UILabel
    
    init() {
        self.titleTextView = UILabel(frame: CGRect(x: 0, y: 0, width: 200, height: 40))
        super.init(nibName: nil, bundle: nil)
        
        self.view = HybridWebview(frame: self.view.frame)

        self.webview!.navigationDelegate = self
        self.webview!.uiDelegate = self
        
        // Don't show text in back button - it's causing some odd display problems
        self.navigationItem.backBarButtonItem = UIBarButtonItem(title: "", style: .plain, target: nil, action: nil)
        
        self.titleTextView.font = UIFont.preferredFont(forTextStyle: UIFontTextStyle.headline)
        self.titleTextView.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        self.titleTextView.textAlignment = .center
//        self.titleTextView.adjustsFontSizeToFitWidth = true
        self.titleTextView.lineBreakMode = NSLineBreakMode.byTruncatingTail
//        self.titleTextView.backgroundColor = UIColor.redColor()
        
        self.navigationItem.titleView = self.titleTextView
    }
    
    
    /// Loads a new URL into the webview. Handles mapping to a local URL when inside a worker context,
    /// and also tracks page load time for logging purposes
    ///
    /// - Parameter urlToLoad: The full, remote URL we want to load. Do not pass in a URL already mapped to localhost.
    func loadURL(_ urlToLoad:URL, attemptAcceleratedLoad: Bool = false) {
        
        if urlToLoad.host == "localhost" {
            log.error("Should never directly load a localhost URL - should be a server URL")
        }
        
        let startRequestTime = Date().timeIntervalSince1970
        
        self.events.once("ready", { _ in
            
            let readyTime = NSDate().timeIntervalSince1970
            
            log.info("LOADED IN " + String(readyTime - startRequestTime))
            
            // Because the URL is likely to have changed, we need to re-save our records to keep them accurate.
            HybridWebview.saveWebViewRecords()
        })
        
        let maybeRewrittenURL = WebServerDomainManager.rewriteURLIfInWorkerDomain(urlToLoad)
        
        log.info("Loading " + maybeRewrittenURL.absoluteString)
        
        let isAcceleratedLoadCapable = maybeRewrittenURL.host! == "localhost" && (self.webview!.url as NSURL?)?.port == (maybeRewrittenURL as NSURL).port
        
        if attemptAcceleratedLoad && isAcceleratedLoadCapable == false {
            log.warning("Wanted to load accelerated, but cannot")
        }
        
        
        if attemptAcceleratedLoad == false || (attemptAcceleratedLoad == true && isAcceleratedLoadCapable == false) {
            // start listening to readystate changes
            self.webview!.readyStateHandler.onchange = self.checkReadyState
            self.webview!.load(URLRequest(url: maybeRewrittenURL))
        } else {
            self.injectHTMLDirectly(maybeRewrittenURL)
        }
        
    }
    
    func injectHTMLDirectly(_ urlToLoad:URL) {
        GlobalFetch.fetch(urlToLoad.absoluteString)
        .then { response in
            
            // Hate Regex in Swift with the power of a thousand suns. This is mostly copied from:
            // https://code.tutsplus.com/tutorials/swift-and-regular-expressions-swift--cms-26626
            
            let responseAsString = String(data: response.data!, encoding: String.Encoding.utf8)!
            
            let regex = try NSRegularExpression(pattern: "<html(?:.*?)>([\\s\\S]+)<\\/html>", options: [
                NSRegularExpression.Options.caseInsensitive
            ])
            
            let matches = regex.matches(in: responseAsString, options: [], range: NSRange(location:0, length: responseAsString.characters.count))
            
            if matches.count == 0 {
                throw ErrorMessage("Regex on page HTML failed.")
            }
            
            let match = matches[0]
            
            let range = match.rangeAt(1)
            
            let r = responseAsString.characters.index(responseAsString.startIndex, offsetBy: range.location) ..< responseAsString.characters.index(responseAsString.startIndex, offsetBy: range.location+range.length)
            
//            let r = responseAsString.startIndex.advancedBy(range.location) ..<
//                responseAsString.startIndex.advancedBy(range.location+range.length)
            
            var htmlInner = responseAsString.substring(with: r)
            htmlInner = htmlInner
                .replacingOccurrences(of: "'", with: "\\'")
                .replacingOccurrences(of: "\n", with: "\\n'")
            
            // We need to check if we have a new active worker for our new URL
            
            return ServiceWorkerManager.getServiceWorkerWhoseScopeContainsURL(urlToLoad)
            .then { sw in
                
                if sw != nil {
                    self.webview!.serviceWorkerAPI?.setNewActiveServiceWorker(sw!)
                }
                
                return Promise<Void> { fulfill, reject in
                    let jsToRun = "history.replaceState({}, '', '" + urlToLoad.absoluteString + "'); document.documentElement.innerHTML = '" + htmlInner + "';" + WebviewJS.reactivateScriptTags + "; true;"
                    
                    self.webview!.evaluateJavaScript(jsToRun, completionHandler: { (retObj, err) in
                        if err != nil {
                            reject(err!)
                        }
                        fulfill()
                        
                    })
                }

            }
            
            
        }
        .then {
            self.fireReadyEvent()
        }
        .catch { err in
            log.error("Encountered error trying to inject HTML directly, reverting to normal load. " + String(describing: err))
            self.webview!.readyStateHandler.onchange = self.checkReadyState
            self.webview!.load(URLRequest(url: urlToLoad))
        }
    }
    
    
    /// Right now there is a flash of the back button when we manually add a view behind the current one.
    /// There's code here for adding a back button manually, but it stops back swiping from working, so it's
    /// commented out for now.
    func prepareHeaderControls(_ alreadyHasBackControl:Bool) {
        
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
//        
//        self.navigationItem.leftBarButtonItem = back
    }
    
//    func popThisView() {
//        let _ = self.hybridNavigationController!.popViewController(animated: true)
//    }
    
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
    func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
        
        if navigationAction.navigationType != WKNavigationType.linkActivated {
            decisionHandler(WKNavigationActionPolicy.allow)
            return
        }
        
        var intendedURL = navigationAction.request.url!
        
        
        if WebServerDomainManager.isLocalServerURL(intendedURL) {
            intendedURL = WebServerDomainManager.mapServerURLToRequestURL(intendedURL)
        }
        
        if navigationAction.targetFrame == nil {
            // been called with _blank
            
            
            UIApplication.shared.open(intendedURL, options: [:], completionHandler: { (success) in
                log.info("Attempt to open URL: " + intendedURL.absoluteString + " resulted in:" + String(success))
            })
        } else {
//            self.placeScreenshotOnTopOfView()
            self.webview!.isUserInteractionEnabled = false
            self.hybridNavigationController!.pushNewHybridWebViewControllerFor(intendedURL)
        }
        
        decisionHandler(WKNavigationActionPolicy.cancel)
    }
    
    
    
    func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {
        
        var intendedURL = navigationAction.request.url!
        
        if WebServerDomainManager.isLocalServerURL(intendedURL) {
            intendedURL = WebServerDomainManager.mapServerURLToRequestURL(intendedURL)
        }
        
        self.hybridNavigationController!.pushNewHybridWebViewControllerFor(intendedURL, animated: true)
        
        return nil
        
    }
    
    
    func fireReadyEvent() {
        let w:Promise<Void> = when(fulfilled: [
            self.waitForRendered(),
            self.setMetadata()
            ])
        
        w.then { () -> Void in
            self.webview!.isActive = true
            self.events.emit("ready", self)
        }
        .catch { err -> Void in
            log.error(String(describing: err))
            // even if these fail we should just show the view
            self.events.emit("ready", self)
            
        }

    }
    
    func checkReadyState(_ readyState:String) {
        if readyState == "interactive" || readyState == "complete" {
            self.webview!.readyStateHandler.onchange = nil
            
            self.fireReadyEvent()
        }
    }
    
    
    /// Grab the metadata from the current page and store in self.currentMetadata
    ///
    /// - Returns: A Promise that resolves when the JS evaluates
    func setMetadata() -> Promise<Void> {
        return self.webview!.getMetadata()
        .then { metadata -> Void in
            self.title = metadata.title
            self.titleTextView.text = metadata.title
            if let color = metadata.color {
                self.titleTextView.textColor = Util.getColorBrightness(color) < 150 ? UIColor.white : UIColor.black
            } else {
                self.titleTextView.textColor = UIColor.black
            }
            
            self.currentMetadata = metadata
            
        }
    }
    
    
    /// Preferred status bar style is lightcontent, but at some point need to add the
    /// ability to flip to dark if the navigation bar has a light background.
    override var preferredStatusBarStyle : UIStatusBarStyle {
        return UIStatusBarStyle.lightContent
    }
    
    
    /// If disappearing because we've been popped from the navigation controller, then
    /// unregister from service worker events, and emit a "popped" event, allowing this
    /// view to be reinserted into the waiting area.
    override func viewDidDisappear(_ animated: Bool) {
        
        super.viewDidDisappear(animated)
        
        if self.screenshotView != nil {
            self.screenshotView!.removeFromSuperview()
            self.screenshotView = nil
        }
        
        self.webview!.isUserInteractionEnabled = true
        
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
    
    var screenshotView:UIImageView?
    
    
    /// When a user has tapped on a link we need to simulate the phone thread being taken up
    /// , sort of, anyway - if you can continue to scroll it looks weird. So we take a screenshot
    /// then place it on top of the view. We remove it again when the view is popped.
    func placeScreenshotOnTopOfView() {
        UIGraphicsBeginImageContextWithOptions(self.webview!.frame.size, false, 0)
        
        let withoutYOffset = CGRect(x:0, y: 0, width:self.webview!.frame.width, height: self.webview!.frame.height)
        
        self.webview!.scrollView.drawHierarchy(in: withoutYOffset, afterScreenUpdates: false)
        
        let image = UIGraphicsGetImageFromCurrentImageContext()!
        UIGraphicsEndImageContext()
        self.screenshotView = UIImageView(image: image)
        self.view.addSubview(self.screenshotView!)
        
    }
    
    func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message: String, initiatedByFrame frame: WKFrameInfo, completionHandler: @escaping () -> Void) {
        
        let alert = UIAlertController(title: webView.title!, message: message, preferredStyle: UIAlertControllerStyle.alert)
        alert.addAction(UIAlertAction(title: "OK", style: UIAlertActionStyle.default, handler: nil))
        self.present(alert, animated: true, completion: completionHandler)
        
    }
}
