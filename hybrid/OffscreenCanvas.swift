//
//  Canvas.swift
//  hybrid
//
//  Created by alastair.coote on 21/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import UIKit


@objc protocol OffscreenCanvasExports : JSExport {
    func getContext(contextType:String) -> OffscreenCanvasRenderingContext2D?
    var width:Int {get}
    var height:Int {get}
    static func devicePixelRatio() -> CGFloat
    init(width:Int, height:Int)
    var requestAnimationFrame: (() -> ())? {get}
}


/// An implementation of the currently-under-consideration OffscreenCanvas spec: https://wiki.whatwg.org/wiki/OffscreenCanvas.
/// Closely mirrors the HTML Canvas API: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API
@objc class OffscreenCanvas : NSObject, OffscreenCanvasExports {
    
    private let twoDContext: OffscreenCanvasRenderingContext2D
    let width:Int
    let height:Int
    
    // Kind of hacky. We should work out a better way to do this.
    var requestAnimationFrame: (() -> ())? = nil
    
    
    /// There's no reason for this to be a function, but for some reason JSExport exports it as one even if
    /// if you declare a static var. So we might as well formalise it, just to make sure it doesn't change
    /// in a future iOS release.
    ///
    /// - Returns: the device pixel ratio
    static func devicePixelRatio() -> CGFloat {
        return UIScreen.mainScreen().scale
    }
    
    required init(width: Int, height: Int) {
        self.width = width
        self.height = height
        self.twoDContext = OffscreenCanvasRenderingContext2D(width: width, height: height)
    }
    
    init(existingContext: CGContext) {
        self.width = CGBitmapContextGetWidth(existingContext)
        self.height = CGBitmapContextGetHeight(existingContext)
        self.twoDContext = OffscreenCanvasRenderingContext2D(context: existingContext)
    }
    
    
    /// Currently only supports 2D contexts, so passing anything other than "2d" will fail.
    ///
    /// - Parameter contextType: Must be "2d" or "2D"
    /// - Returns: An instance of OffscreenCanvasRenderingContext2D
    func getContext(contextType:String) -> OffscreenCanvasRenderingContext2D? {
    
        if contextType.lowercaseString != "2d" {
            return nil
        }
        
        return self.twoDContext
    }
}
