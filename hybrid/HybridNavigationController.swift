//
//  HybridNavigationController.swift
//  hybrid
//
//  Created by alastair.coote on 25/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

class HybridNavigationController : UINavigationController, UINavigationControllerDelegate {
    
    let waitingArea:UINavigationController
    var launchViewController:UIViewController?
    
    init() {
        self.waitingArea = UINavigationController()
        let storyBoard = UIStoryboard(name: "LaunchScreen", bundle: nil)
        self.launchViewController = storyBoard.instantiateInitialViewController()!

        super.init(nibName: nil, bundle: nil)
        
        // We render this in the same size as the original controller, but off-screen
        self.waitingArea.view.frame = CGRect(origin: CGPoint(x: self.view.frame.width, y:0), size: self.view.frame.size)
        self.view.addSubview(self.waitingArea.view)
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
        
        return poppedController
    }
    
    func getNewController() -> HybridWebviewController {
        
        let inWaitingArea = self.waitingArea.topViewController
        if inWaitingArea != nil {
            return inWaitingArea as! HybridWebviewController
        }
        return HybridWebviewController(navController: self)
    }
    
    func addControllerToWaitingArea(controller: HybridWebviewController) {
        self.waitingArea.pushViewController(controller, animated: false)
        
        // Reset our webview with a new request to the placeholder
        
        let components = NSURLComponents(string: "http://localhost/__placeholder")!
        components.port = WebServer.current!.port
        controller.webview!.loadRequest(NSURLRequest(URL: components.URL!))
    }
    
    func pushNewHybridWebViewControllerFor(url:NSURL) {
        let startRequestTime = NSDate().timeIntervalSince1970
        let newInstance = self.getNewController()
        
        newInstance.events.once("ready", { _ in
            if let meta = newInstance.currentMetadata {
                self.applyMetadata(meta)
            }
            
            let readyTime = NSDate().timeIntervalSince1970
            
            NSLog("LOADED IN " + String(readyTime - startRequestTime))
            
            self.pushViewController(newInstance, animated: true)
            
            if self.launchViewController != nil {
                UIView.animateWithDuration(0.2, animations: {
                    self.launchViewController!.view.transform = CGAffineTransformMakeScale(4, 4)
                    self.launchViewController!.view.alpha = 0
                }, completion: { finished in
                    self.launchViewController!.view.removeFromSuperview()
                    self.launchViewController = nil
                })
            }
        })
        
        newInstance.loadURL(url)
    }
    
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
        
        // Ensure we have a cached view ready to go
        
        if self.waitingArea.viewControllers.count == 0 {
            self.addControllerToWaitingArea(HybridWebviewController(navController: self))
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
