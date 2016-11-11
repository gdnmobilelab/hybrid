//
//  CanvasView.swift
//  hybrid
//
//  Created by alastair.coote on 21/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import JavaScriptCore
import PromiseKit

@objc protocol CanvasEventDataExports: JSExport {
    var canvas: OffscreenCanvas {get}
    func requestAnimationFrame()
    var __keys:[String] {get}
}

@objc class CanvasEventData : NSObject, CanvasEventDataExports {
    
    let canvas:OffscreenCanvas
    let targetView:CanvasView
    
    init(canvas:OffscreenCanvas, targetView: CanvasView) {
        self.canvas = canvas
        self.targetView = targetView
    }
    
    func requestAnimationFrame() {
        self.targetView.requestAnimationFrame()
    }
    
    var __keys: [String] {
        get {
            return [
                "canvas",
                "requestAnimationFrame"
            ]
        }
    }
    
}

class CanvasView: UIView {
    
    private var canvasData: CanvasEventData?
    private let worker: ServiceWorkerInstance
    
    
    private func multiplyByRatio(num:Int) -> Int {
        return Int(CGFloat(num) * UIScreen.mainScreen().scale)
    }
    
    init(width: Int, ratio: Float, worker: ServiceWorkerInstance) {
        
        let height = Int(Float(width) * ratio)
        self.worker = worker
        
        super.init(frame: CGRect(x: 0, y: 0, width: width, height: height))
        
        
        let canvas = OffscreenCanvas(width: multiplyByRatio(width), height: multiplyByRatio(height))
        canvas.getContext("2d")!.fillStyle = "#ffffff"
        canvas.getContext("2d")!.fillRect(0, y: 0, width: CGFloat(canvas.width), height: CGFloat(canvas.height))
        self.canvasData = CanvasEventData(canvas: canvas, targetView: self)
        
        self.requestAnimationFrame()
        
        let test = CADisplayLink(target: self, selector: #selector(self.runUpdate))
        test.addToRunLoop(NSRunLoop.mainRunLoop(), forMode: NSDefaultRunLoopMode)
        
    }
    
    var wantsAnimationFrame:Bool = false
    var pendingRender = false
    
    func runUpdate() {

        if self.wantsAnimationFrame == true && self.pendingRender == false {
            self.wantsAnimationFrame = false
            worker.dispatchExtendableEvent("notification-canvas", data: self.canvasData!)
                .then { _ -> Void in
                    self.pendingRender = true
                    self.setNeedsDisplay()
            }
        }
        
    }
    
    func requestAnimationFrame() {
        self.wantsAnimationFrame = true
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
    override func drawRect(rect: CGRect) {
        
        let ctx = self.canvasData!.canvas.getContext("2d")!.context
        
        UIGraphicsPushContext(ctx)
        
        let img = CGBitmapContextCreateImage(ctx)!
        
        UIGraphicsPopContext()
        
        CGContextDrawImage(UIGraphicsGetCurrentContext()!, rect, img)
        
        self.pendingRender = false
    }
    
    
}
