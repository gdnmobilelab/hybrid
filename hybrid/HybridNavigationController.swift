//
//  HybridNavigationController.swift
//  hybrid
//
//  Created by alastair.coote on 25/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import PromiseKit

class HybridNavigationController : UINavigationController, UINavigationControllerDelegate {
    
    let waitingArea:UIView
    var launchViewController:UIViewController?
    
    init() {
        self.waitingArea = UIView()
        let storyBoard = UIStoryboard(name: "LaunchScreen", bundle: nil)
        self.launchViewController = storyBoard.instantiateInitialViewController()!

        super.init(nibName: nil, bundle: nil)
        
        // We render this in the same size as the original controller, but off-screen
        self.waitingArea.frame = CGRect(origin: CGPoint(x: self.view.frame.width - 100, y:0), size: self.view.frame.size)
        self.view.addSubview(self.waitingArea)
        self.navigationBar.translucent = false
        self.delegate = self
        
        self.view.addSubview(self.launchViewController!.view)
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func popViewControllerAnimated(animated: Bool) -> UIViewController? {
        
        // We want to restore the color/styles of the last viewcontroller.
        // So, let's check if it has metadata, and if so, apply it.
        
        let poppedController = super.popViewControllerAnimated(animated)
        let top = self.topViewController as? HybridWebviewController
        if top != nil && top?.currentMetadata != nil {
            self.applyMetadata(top!.currentMetadata!)
        }
        
        if top != nil {
            top!.fiddleContentInsets()
        }
        
        return poppedController
    }
    
    var waitingAreaViewControllers = [HybridWebviewController]()
    
    func getNewController() -> HybridWebviewController {
        log.info("WAITING AREA VIEWS:")
        self.waitingAreaViewControllers.forEach { uiv in
            let hwv = (uiv as! HybridWebviewController)
            log.info("AVAILABLE: " + hwv.webview!.URL!.absoluteString! + ", is ready: " + String(hwv.isReady))
//            return (hwv.webview!.URL, hwv.isReady)
        }
        
        let inWaitingArea = waitingAreaViewControllers.last
       
        if inWaitingArea != nil && inWaitingArea!.isReady == true {
            self.removeFromWaiting(inWaitingArea!)
            return inWaitingArea!
        }
        let newController = HybridWebviewController()
        self.addToWaiting(newController)
        self.removeFromWaiting(newController)
        return newController
    }
    
    func removeFromWaiting(controller:HybridWebviewController) {
        let idx = self.waitingAreaViewControllers.indexOf(controller)
        self.waitingAreaViewControllers.removeAtIndex(idx!)
    }
    
    func addToWaiting(controller:HybridWebviewController) {
        self.waitingArea.addSubview(controller.webview!)
        self.waitingAreaViewControllers.insert(controller, atIndex: 0)
    }
    
    func addControllerToWaitingArea(controller: HybridWebviewController, forDomain: NSURL) {
        
        self.addToWaiting(controller)
        
        controller.webview?.loadHTMLString("<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1,user-scalable=no\" /></head><body></body></html>", baseURL: forDomain)
        
       
//        // Reset our webview with a new request to the placeholder
//        
//        let rewrittenURL = WebServerDomainManager.rewriteURLIfInWorkerDomain(forDomain)
//        
//        if rewrittenURL == forDomain && WebServerDomainManager.isLocalServerURL(rewrittenURL) == false {
//            // If the page isn't under any service worker scope we can't really do our
//            // placeholder
//            
//            log.warning("Tried to create placeholder view for non-local URL " + forDomain.absoluteString!)
//            controller.loadURL(NSURL(string: "about:blank")!, attemptAcceleratedLoading: false)
//            return
//        }
//        
//        
//        let components = NSURLComponents(URL: forDomain, resolvingAgainstBaseURL: true)!
//        
//        components.path = "/__placeholder"
//        
//        controller.loadURL(components.URL!, attemptAcceleratedLoading: false)

    }
    
    private func prepareWebviewFor(url:NSURL, attemptAcceleratedLoading:Bool) -> Promise<HybridWebviewController> {
        let newInstance = self.getNewController()
        
        var hasFiredReady = false
        
        return Promise<HybridWebviewController> { fulfill, reject in
            newInstance.events.once("ready", { _ in
                hasFiredReady = true
                if let meta = newInstance.currentMetadata {
                    self.applyMetadata(meta)
                }
                
                newInstance.prepareHeaderControls(self.viewControllers.count > 0)
                
                fulfill(newInstance)
            })
            
            newInstance.events.once("popped", self.addPoppedViewBackToWaitingStack)
            
            newInstance.loadURL(url, attemptAcceleratedLoading: attemptAcceleratedLoading)
            
            // Every now and then a view just doesn't load, for reasons that aren't clear.
            // So if it hasn't loaded within a second, push it anyway.
            
            let delayTime = dispatch_time(DISPATCH_TIME_NOW, Int64(1 * Double(NSEC_PER_SEC)))
            dispatch_after(delayTime, dispatch_get_main_queue()) {
                if hasFiredReady == false {
//                    newInstance.events.emit("ready", newInstance)
                }
            }
            
            

        }
        
    }
    
    func addPoppedViewBackToWaitingStack(hybrid:HybridWebviewController) {
        // Once this has been pushed off the stack, reset it with
        // the placeholder URL for the new top domain
        
        let newTop = self.topViewController as? HybridWebviewController
        
        if newTop != nil {
            self.addControllerToWaitingArea(hybrid, forDomain: newTop!.webview!.mappedURL!)
        } else {
            // if we don't have a top view (should never happen!) just
            // use the view's own domain
            self.addControllerToWaitingArea(hybrid, forDomain: hybrid.webview!.mappedURL!)
        }

    }
    
    func pushNewHybridWebViewControllerFor(url:NSURL) {
        
        self.prepareWebviewFor(url, attemptAcceleratedLoading: true)
        .then { newInstance -> Void in
            
            self.pushViewController(newInstance, animated: true)
            
            newInstance.fiddleContentInsets()
            
            if self.launchViewController != nil {
                
                let viewController = self.launchViewController!
                self.launchViewController = nil
                
                UIView.animateWithDuration(0.2, animations: {
                    viewController.view.transform = CGAffineTransformMakeScale(4, 4)
                    viewController.view.alpha = 0
                    }, completion: { finished in
                        viewController.view.removeFromSuperview()
                        
                })
            }
                
        }
        
    }
    
    
//    func popToNewHybridWebViewControllerFor(url:NSURL) {
//        self.prepareWebviewFor(url)
//        .then { newInstance -> Void in
//            newInstance.prepareHeaderControls(self.viewControllers.count > 1)
//            self.viewControllers.insert(newInstance, atIndex: self.viewControllers.count - 1)
//            newInstance.fiddleContentInsets()
//            self.popViewControllerAnimated(true)
//        }
//    }
    
    func applyMetadata(metadata:HybridWebviewMetadata) {
        self.navigationBar.barTintColor = metadata.color
        
        var isBright = true
        
        if let color = metadata.color {
            var brightness:CGFloat = 0
            color.getHue(nil, saturation: nil, brightness: &brightness, alpha: nil)
            
            isBright = brightness * 255 > 150

        }
        
        if isBright == false {
            self.navigationBar.tintColor = UIColor.whiteColor()
            self.statusBarStyle = UIStatusBarStyle.LightContent
            self.navigationBar.titleTextAttributes = [
                NSForegroundColorAttributeName: UIColor.whiteColor()
            ]
            
        } else {
            self.navigationBar.tintColor = UIColor.blackColor()
            self.statusBarStyle = UIStatusBarStyle.Default
            self.navigationBar.titleTextAttributes = [
                NSForegroundColorAttributeName: UIColor.blackColor()
            ]
        }
        
        self.setNeedsStatusBarAppearanceUpdate()
        
    }
    
    func navigationController(navigationController: UINavigationController, didShowViewController viewController: UIViewController, animated: Bool) {
        
        let hybrid = viewController as! HybridWebviewController
        
        
        // Ensure we have a cached view ready to go
        
        if self.waitingAreaViewControllers.count == 0 {
            
            // We put this behind a timer because for some reason the title text
            // of the recently pushed view sometimes disappears if we don't. Hooray
            // weird, inconsistent bugs!
            
            
            let delayTime = dispatch_time(DISPATCH_TIME_NOW, Int64(1 * Double(NSEC_PER_SEC)))
            dispatch_after(delayTime, dispatch_get_main_queue()) {
                self.addControllerToWaitingArea(HybridWebviewController(), forDomain: hybrid.webview!.mappedURL!)

            }
        }
        
        if self.viewControllers.indexOf(viewController) == 0 && hybrid.currentMetadata?.defaultBackURL != nil {
            
            // If this isn't the furthest back view then we already have a navigation path,
            // we don't need to restore the default one.
            
            var backURL = NSURL(string:hybrid.currentMetadata!.defaultBackURL!, relativeToURL: hybrid.webview!.URL!)!
            
            if WebServerDomainManager.isLocalServerURL(backURL) {
                backURL = WebServerDomainManager.mapServerURLToRequestURL(backURL)
            }
            
            self.prepareWebviewFor(backURL, attemptAcceleratedLoading: false)
            .then { controller in
                self.viewControllers.insert(controller, atIndex: 0)
            }
            
//            let underneathView = self.getNewController()
//            
//            self.viewControllers.insert(underneathView, atIndex: 0)
//            let backURL = NSURL(string:hybrid.currentMetadata!.defaultBackURL!, relativeToURL: hybrid.webview!.URL!)!
//            underneathView.events.once("popped", self.addPoppedViewBackToWaitingStack)
//            
//            var urlToLoad = backURL
//            
//            if WebServerDomainManager.isLocalServerURL(urlToLoad) {
//                urlToLoad = WebServerDomainManager.mapServerURLToRequestURL(backURL)
//            }
//            
//            underneathView.loadURL(urlToLoad, attemptAcceleratedLoading: false)

        }
    
        
        
    }
    
    private var statusBarStyle = UIStatusBarStyle.Default
    
    override func preferredStatusBarStyle() -> UIStatusBarStyle {
        return statusBarStyle
    }
    
    static var current:HybridNavigationController?
    
    static func create() -> HybridNavigationController {
        self.current = HybridNavigationController()
        return self.current!
    }
    

}
