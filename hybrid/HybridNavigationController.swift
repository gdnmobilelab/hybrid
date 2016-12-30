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


/// The main view stack of the app. Contains a hidden "waiting area" where we store HybridWebviews not currently
/// in use, which lets us speed up load times
class HybridNavigationController : UINavigationController, UINavigationControllerDelegate {
    
    /// Feels very hacky, but we create a view that sits 1px to the right of the edge of the screen where we
    /// store HybridWebviews that we can immediately push into our view stack. This seems to have a significant
    /// benefit in loading times.
    let waitingArea:UIView
    
    
    /// We manually recreate the launch view storyboard in order to seamlessly pass off from the launch view to our
    /// controller without any visual difference. Then when our first webview has rendered successfully we transition
    /// the launch view out.
    var launchViewController:UIViewController?
    
    init() {
        self.waitingArea = UIView()

        super.init(nibName: nil, bundle: nil)
        
        // We render this in the same size as the original controller, but off-screen
        self.waitingArea.frame = CGRect(origin: CGPoint(x: self.view.frame.width + 1, y:0), size: self.view.frame.size)
        self.view.addSubview(self.waitingArea)
        self.navigationBar.isTranslucent = false
        self.delegate = self
        
        self.addLaunchViewToController()
    }
    
    /// Take the launch storyboard and manually add it on top of our existing view stack.
    func addLaunchViewToController() {
        let storyBoard = UIStoryboard(name: "LaunchScreen", bundle: nil)
        self.launchViewController = storyBoard.instantiateInitialViewController()!
        self.view.addSubview(self.launchViewController!.view)
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
    /// Different HybridWebviewControllers can have different background colors, so we
    /// want to make sure we set the bar to the color of the new top view when we pop.
    override func popViewController(animated: Bool) -> UIViewController? {
        
        // We want to restore the color/styles of the last viewcontroller.
        // So, let's check if it has metadata, and if so, apply it.
        
        let poppedController = super.popViewController(animated: animated)
        let top = self.topViewController as? HybridWebviewController
        
        if top != nil && top?.currentMetadata != nil {
            self.applyMetadata(top!.currentMetadata!)
        }
    
        return poppedController
    }
    
    
    /// An array of HybridWebviewControllers that we have available to be used immediately
    /// when we want to push a new view into our stack
    var waitingAreaViewControllers = [HybridWebviewController]()
    
    
    /// Grab the next available controller in the waiting area, remove from our array of
    /// waiting controllers and return. If there are no controllers available, create a new one
    /// and return it immediately.
    ///
    /// - Returns: a HybridWebviewController whose view is currently rendering in the waiting area.
    func getNewController() -> HybridWebviewController {
        let inWaitingArea = waitingAreaViewControllers.last
       
        if inWaitingArea != nil /*&& inWaitingArea!.isReady == true*/ {
            self.removeControllerFromWaitingArray(inWaitingArea!)
            return inWaitingArea!
        }
        let newController = HybridWebviewController()
        
        self.addViewToWaitingArea(newController.webview!)
        return newController
    }
    
    
    /// Remove the provided controller from the array of waiting controllers. Does not remove
    /// the view from the waiting area because that will happen automatically when we add it
    /// to another view.
    ///
    /// - Parameter controller: The controller to remove from the array
    fileprivate func removeControllerFromWaitingArray(_ controller:HybridWebviewController) {
        let idx = self.waitingAreaViewControllers.index(of: controller)
        self.waitingAreaViewControllers.remove(at: idx!)
    }
    
    
    /// Add the provided controller to out internal array of waiting controllers. NOTE: this
    /// does not add the HybridWebView to the waiting area view. Use addViewToWaitingArea()
    /// for that.
    ///
    /// - Parameter controller: The controller to add
    fileprivate func addControllerToWaitingArray(_ controller:HybridWebviewController) {
        self.waitingArea.addSubview(controller.webview!)
        self.waitingAreaViewControllers.insert(controller, at: 0)
    }
    
    
    /// Add a HybridWebview to the waiting area. Does not also add the controller to the
    /// waiting controllers array - use addControllerToWaitingArray() for that.
    ///
    /// - Parameter view: The HybridWebview to add to the waiting area view.
    fileprivate func addViewToWaitingArea(_ view:HybridWebview) {
        self.waitingArea.addSubview(view)
    }
    
    
    /// Add both the controller and its view to our waiting area. Also reset the content of
    /// the webview to be an empty page, to attempt to claw back some memory
    ///
    /// - Parameters:
    ///   - controller: The controller to add and reset
    ///   - forDomain: Currently not used, but might be reactivated to improve load times by using direct HTML injection in the future
    func addControllerAndViewToWaitingArea(_ controller: HybridWebviewController, forDomain: URL) {
        controller.webview!.isActive = false
        self.addControllerToWaitingArray(controller)
        self.addViewToWaitingArea(controller.webview!)
        
        controller.webview!.loadHTMLString("<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1,user-scalable=no\" /></head><body><script></script></body></html>", baseURL: forDomain)
    }
    
    
    /// Grab an available HybridWebviewController and load the provided URL into it
    ///
    /// - Parameter url: The URL we want to load. Not a localhost URL - it will be mapped automatically.
    /// - Returns: A promise that resolves when the page is loaded and the view is painted and ready.
    fileprivate func prepareWebviewFor(_ url:URL, attemptAcceleratedLoading:Bool) -> Promise<HybridWebviewController> {
        let newInstance = self.getNewController()
        
        return Promise<HybridWebviewController> { fulfill, reject in
            newInstance.events.once("ready", { _ in
               
                if let meta = newInstance.currentMetadata {
                    self.applyMetadata(meta)
                }
                
                newInstance.prepareHeaderControls(self.viewControllers.count > 0)
                
                fulfill(newInstance)
            })
            
            newInstance.events.once("popped", self.addPoppedViewBackToWaitingStack)
            newInstance.webview!.registerWebviewForServiceWorkerEvents()
            newInstance.loadURL(url, attemptAcceleratedLoad: attemptAcceleratedLoading)

        }
        
    }
    
    
    /// Added as a listener to controllers when they are pushed into the view stack, to
    /// ensure they are re-added to the waiting area once they are pushed back off the
    /// view stack.
    ///
    /// - Parameter hybrid: The controller that has been popped.
    func addPoppedViewBackToWaitingStack(_ hybrid:HybridWebviewController) {
        // Once this has been pushed off the stack, reset it with
        // the placeholder URL for the new top domain
        
        var newTop = self.topViewController as? HybridWebviewController
        
        if newTop == nil {
            // if we don't have a top view (should never happen!) just
            // use the view's own domain
            newTop = hybrid
        }
        
        let urlToPreload = WebServerDomainManager.rewriteURLIfInWorkerDomain(newTop!.webview!.url!)
        self.addControllerAndViewToWaitingArea(hybrid, forDomain: urlToPreload)
    }
    
    
    /// Prepare and load a webview for the specified URL, then push it into the view stack
    /// when it is ready.
    ///
    /// - Parameter url: The URL to load. Not localhost URL - is mapped automatically.
    func pushNewHybridWebViewControllerFor(_ url:URL, animated:Bool = true) {
        
        self.prepareWebviewFor(url, attemptAcceleratedLoading: true)
        .then { newInstance -> Void in
            
            self.pushViewController(newInstance, animated: animated)

            if self.launchViewController != nil {
                self.hideLaunchView()
            }
                
        }
        .catch { err in
            log.error("Failed to push view controller for " + url.absoluteString + ", " + String(describing: err))
        }
        
    }
    
    
    /// Transition the launch view out of view by making transparent and scaling outwards
    /// then removing the view entirely once that transition is complete
    func hideLaunchView() {
        let viewController = self.launchViewController!
        self.launchViewController = nil
        
        UIView.animate(withDuration: 0.2, animations: {
            viewController.view.transform = CGAffineTransform(scaleX: 4, y: 4)
            viewController.view.alpha = 0
            }, completion: { finished in
                viewController.view.removeFromSuperview()
                
        })
    }
    
    
    /// Set bar tint color and attempt to set the status bar style depending on
    /// what that color is. This needs a lot of work.
    ///
    /// - Parameter metadata: the controller metadata to apply
    func applyMetadata(_ metadata:HybridWebviewMetadata) {
        
        
        var isBright = true
        
        if let color = metadata.color {
            var brightness:CGFloat = 0
            color.getHue(nil, saturation: nil, brightness: &brightness, alpha: nil)
            
            isBright = brightness * 255 > 150
            self.navigationBar.barTintColor = color
        } else {
            self.navigationBar.barTintColor = UIColor.white
        }
        
        if isBright == false {
            self.navigationBar.tintColor = UIColor.white
            self.statusBarStyle = UIStatusBarStyle.lightContent
            self.navigationBar.titleTextAttributes = [
                NSForegroundColorAttributeName: UIColor.white
            ]
            
        } else {
            self.navigationBar.tintColor = UIColor.black
            self.statusBarStyle = UIStatusBarStyle.default
            self.navigationBar.titleTextAttributes = [
                NSForegroundColorAttributeName: UIColor.black
            ]
        }
        
        self.setNeedsStatusBarAppearanceUpdate()
        
    }
    
    
    /// When a controller show is complete, we check to see if there is a controller in the waiting area - if not, create one.
    /// Then check to see if our new controller has a default back URL. If it does, and we don't have a parent view, create
    /// it and put it in the stack.
    func navigationController(_ navigationController: UINavigationController, didShow viewController: UIViewController, animated: Bool) {
        
        let hybrid = viewController as! HybridWebviewController
        
        if self.waitingAreaViewControllers.count == 0 {
            // Ensure we have a cached view ready to go
            
            let urlToPreload = WebServerDomainManager.rewriteURLIfInWorkerDomain(hybrid.webview!.url!)
            
            self.addControllerAndViewToWaitingArea(HybridWebviewController(), forDomain: urlToPreload)
        }
        
        if self.viewControllers.index(of: viewController) == 0 && hybrid.currentMetadata?.defaultBackURL != nil {
            
            // If this isn't the furthest back view then we already have a navigation path,
            // we don't need to restore the default one.
            
            var backURL = URL(string:hybrid.currentMetadata!.defaultBackURL!, relativeTo: hybrid.webview!.url!)!
            
            if WebServerDomainManager.isLocalServerURL(backURL) {
                backURL = WebServerDomainManager.mapServerURLToRequestURL(backURL)
            }
            
            self.prepareWebviewFor(backURL, attemptAcceleratedLoading: false)
            .then { controller in
                self.viewControllers.insert(controller, at: 0)
            }
            .catch { err in
                log.error("Failed to create view from default back URL " + backURL.absoluteString + ": " + String(describing: err))
            }

        }

    }
    
    
    /// In theory this is set during setMetadata(). Haven't experimented extensively with light-colored navigation bars
    /// though, so this needs more work.
    fileprivate var statusBarStyle = UIStatusBarStyle.default
    
    override var preferredStatusBarStyle : UIStatusBarStyle {
        return statusBarStyle
    }
    
    
    /// The main HybridNavigationController the app uses. We only ever need one.
    static var current:HybridNavigationController?
    
    
    /// Create our main controller. Called in our AppDelegate.
    static func create() -> HybridNavigationController {
        self.current = HybridNavigationController()
        return self.current!
    }
    

}
