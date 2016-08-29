//
//  WaitingArea.swift
//  hybrid
//
//  Created by alastair.coote on 29/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

class WaitingArea {
    
    // Silly idea. But it might just work!
    
    private static var poolOfAvailableWebviews = [HybridWebview]()
    
    static func add(wv:HybridWebview) {
        self.poolOfAvailableWebviews.append(wv)
        wv.hidden = true
        AppDelegate.window!.addSubview(wv)
        
        let components = NSURLComponents(string: "http://localhost/__placeholder")!
        components.port = WebServer.current!.port
        
        wv.loadRequest(NSURLRequest(URL: components.URL!))
        
    }
    
    static func get() -> HybridWebview {
        if self.poolOfAvailableWebviews.count > 0 {
            let availableView = self.poolOfAvailableWebviews.removeFirst()
            let fr = availableView.frame
            availableView.hidden = false
            return availableView
        }
        return HybridWebview(frame: CGRect(x: 0, y: 0, width: 0, height: 0))
    }

   
}


