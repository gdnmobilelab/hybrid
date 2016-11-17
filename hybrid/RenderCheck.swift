//
//  RenderCheck.swift
//  hybrid
//
//  Created by alastair.coote on 17/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit

/// This hacky, hacky class attempts to prevent the "white flash" we see when pushing WKWebViews into navigation
/// controllers. The issue appears to stem from WKWebView being out of process, and the JavaScript "load" event
/// firing before the view has actually painted successfully.
///
/// So, what we do is inject a 1px square into the webview, then take a tiny screenshot of the painted ScrollView
/// (*not* WebView) to see if that pixel has painted or not. Then repeat until it has been.
class RenderCheck {
    
    private let target:WKWebView
    private var renderCheckContext:CGContext?
    private var pixel:UnsafeMutablePointer<CUnsignedChar>?
    private let width: Int
    private let height: Int
    private var displayLink:CADisplayLink?
    private var onRender:(()->())?
    
    init(target:WKWebView) {
        self.target = target
        
        // Since we only need the top row of pixels of the view, we can set our bitmap to be 1px high. Saves
        // on memory.
        
        self.height = 1
        
        // We put the pixel in the top right of the view, so that there is less chance it will be visible
        // while the animated push occurs. This means, though, that we need to capture the full width of
        // the view (I haven't yet found out how to avoid doing that, anyway)
        
        self.width = Int(target.frame.width)
    }
    
    private func checkIfRendered() -> Bool {
        self.target.scrollView.layer.renderInContext(self.renderCheckContext!)
        
        let startAt = 4 * width * height - 4
        
        let red = CGFloat(self.pixel![startAt])
        let green = CGFloat(self.pixel![startAt + 1])
        let blue =  CGFloat(self.pixel![startAt + 2])
        
        return red == 0 && blue == 255 && green == 255
    }
    
    @objc private func checkForRender() {
        if self.checkIfRendered() == true {
            log.debug("Checked if webview was ready, it WAS")
            self.pixel!.destroy()
            self.displayLink!.removeFromRunLoop(NSRunLoop.mainRunLoop(), forMode: NSDefaultRunLoopMode)
            self.onRender!()
        } else {
            log.debug("Checked if webview was ready, it was not")
        }
    }
    
    
    
    
    /// Start the  loop that checks whether the view has rendered or not.
    ///
    /// - Parameter onRender: The function to run when the render was successful.
    func waitForRender(onRender: () -> ()) {
        self.onRender = onRender
        // 4 * because we need to store the red, green, blue and alpha of each pixel
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.PremultipliedLast.rawValue)
        self.pixel = UnsafeMutablePointer<CUnsignedChar>.alloc(4 * width * height)
        self.renderCheckContext = CGBitmapContextCreate(pixel!, width, height, 8, width * 4, colorSpace, bitmapInfo.rawValue)!
        
        self.target.evaluateJavaScript(WebviewJS.setLoadingIndicator, completionHandler: nil)

        self.displayLink = CADisplayLink(target: self, selector: #selector(self.checkForRender))
        self.displayLink!.addToRunLoop(NSRunLoop.mainRunLoop(), forMode: NSDefaultRunLoopMode)

    }
}
