//
//  HybridNavigationController.swift
//  hybrid
//
//  Created by alastair.coote on 25/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

class HybridNavigationController : UINavigationController {
    
    let waitingArea:UINavigationController
    
    init() {
        self.waitingArea = UINavigationController()
        super.init(nibName: nil, bundle: nil)
        
        // We render this in the same size as the original controller, but off-screen
        self.waitingArea.view.frame = CGRect(origin: CGPoint(x: self.view.frame.width, y:0), size: self.view.frame.size)
        self.view.addSubview(self.waitingArea.view)
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    func getNewController() -> HybridWebviewController {
        let inWaitingArea = self.waitingArea.viewControllers.first
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
