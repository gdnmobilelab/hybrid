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
    
    
    func pushNewHybridWebViewControllerFor(url:NSURL) {
        let startRequestTime = NSDate().timeIntervalSince1970
        let newInstance = HybridWebviewController(urlToLoad: url, navController: self)
        newInstance.events.once("ready", { _ in
            if let meta = newInstance.currentMetadata {
                self.applyMetadata(meta)
            }
            
            let readyTime = NSDate().timeIntervalSince1970
            
            NSLog("LOADED IN " + String(readyTime - startRequestTime))
            
            self.pushViewController(newInstance, animated: true)
        })
    }
    
    func applyMetadata(metadata:HybridWebviewMetadata) {
        self.navigationBar.barTintColor = metadata.color
        
        var isBright = false
        
        if let color = metadata.color {
            var brightness:CGFloat = 0
            color.getHue(nil, saturation: nil, brightness: &brightness, alpha: nil)
            
            isBright = brightness * 255 > 150

        }
        
        if isBright == false {
            self.navigationBar.tintColor = UIColor.whiteColor()
            self.navigationBar.titleTextAttributes = [
                NSForegroundColorAttributeName: UIColor.whiteColor()
            ]
            
        } else {
            self.navigationBar.tintColor = UIColor.blackColor()
            self.navigationBar.titleTextAttributes = [
                NSForegroundColorAttributeName: UIColor.blackColor()
            ]
        }
        
        self.setNeedsStatusBarAppearanceUpdate()
        
       
        
    }
    
    override func preferredStatusBarStyle() -> UIStatusBarStyle {
        return UIStatusBarStyle.LightContent
    }
    
    static var current:HybridNavigationController?
    
    static func create() -> HybridNavigationController {
        self.current = HybridNavigationController()
        return self.current!
    }

}
