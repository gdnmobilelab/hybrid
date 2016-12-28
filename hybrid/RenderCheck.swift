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
    
    fileprivate let target:WKWebView
    fileprivate var renderCheckContext:CGContext?
    fileprivate var pixel:UnsafeMutablePointer<CUnsignedChar>?
    fileprivate let width: Int
    fileprivate let height: Int
    fileprivate var displayLink:CADisplayLink?
    fileprivate var onRender:(()->())?
    
    class colorToCheckFor {
        static let red:CGFloat = 0
        static let blue:CGFloat = 255
        static let green:CGFloat = 255
        
        static func toRGBString() -> String {
            
            let asString = [red,green,blue].map { i in
                return String(Int(i))
            }.joined(separator: ",")
            
            return "rgb(" + asString + ")"
        }
    }
    
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
    
    
    /// Check the pixel to see if it's the color we specified in the indicator
    ///
    /// - Returns: True if the pixel matches the color specified in colorToCheckFor. Otherwise, false.
    fileprivate func checkIfRendered() -> Bool {    
        self.target.scrollView.layer.render(in: self.renderCheckContext!)
        
        let startAt = 4 * width * height - 4
        
        let red = CGFloat(self.pixel![startAt])
        let green = CGFloat(self.pixel![startAt + 1])
        let blue =  CGFloat(self.pixel![startAt + 2])
        
        return red == colorToCheckFor.red && blue == colorToCheckFor.blue && green == colorToCheckFor.green
    }
    
    
    /// Used in the CADisplayLink callback to fire the actual pixel check, then fire onRender if successful
    @objc fileprivate func checkForRender() {
        if self.checkIfRendered() == true {
            log.debug("Checked if webview was ready, it WAS")
            self.pixel!.deinitialize()
            self.displayLink!.remove(from: RunLoop.main, forMode: RunLoopMode.defaultRunLoopMode)
            self.target.evaluateJavaScript(WebviewJS.removeLoadingIndicator, completionHandler: nil)
            self.onRender!()
        } else {
            log.debug("Checked if webview was ready, it was not")
        }
    }
    
    
    
    
    /// Start the  loop that checks whether the view has rendered or not.
    ///
    /// - Parameter onRender: The function to run when the render was successful.
    func waitForRender(_ onRender: @escaping () -> ()) {
        self.onRender = onRender
        
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        let bitmapInfo = CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue)
        
        // 4 * because we need to store the red, green, blue and alpha of each pixel
        self.pixel = UnsafeMutablePointer<CUnsignedChar>.allocate(capacity: 4 * width * height)
        
        self.renderCheckContext = CGContext(data: pixel!, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: colorSpace, bitmapInfo: bitmapInfo.rawValue)!
        
        self.target.evaluateJavaScript(WebviewJS.setLoadingIndicator, completionHandler: nil)

        self.displayLink = CADisplayLink(target: self, selector: #selector(self.checkForRender))
        self.displayLink!.add(to: RunLoop.main, forMode: RunLoopMode.defaultRunLoopMode)

    }
}
