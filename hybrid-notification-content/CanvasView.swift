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
    var new:Bool {get}
    func requestAnimationFrame()
}

@objc class CanvasEventData : ExtendableEvent, CanvasEventDataExports {
    
    let canvas:OffscreenCanvas
    let targetView:CanvasView
    var new:Bool = true
    
    init(canvas:OffscreenCanvas, targetView: CanvasView) {
        self.canvas = canvas
        self.targetView = targetView
        super.init(type: "notification-canvas")
    }
    
    required init(type: String) {
        fatalError("init(type:) has not been implemented")
    }
    
    func requestAnimationFrame() {
        self.new = false
        self.targetView.requestAnimationFrame()
    }

}

class CanvasView: UIView {
    
    private var canvasData: CanvasEventData?
    private let worker: ServiceWorkerInstance
    private var displayLink:CADisplayLink?
    
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
        
        self.displayLink = CADisplayLink(target: self, selector: #selector(self.runUpdate))
        self.displayLink!.addToRunLoop(NSRunLoop.mainRunLoop(), forMode: NSDefaultRunLoopMode)
        
    }
    
    override func removeFromSuperview() {
        super.removeFromSuperview()
        self.displayLink!.removeFromRunLoop(NSRunLoop.mainRunLoop(), forMode: NSDefaultRunLoopMode)
    }
    
    var wantsAnimationFrame:Bool = false
    var pendingRender = false
    
    func runUpdate() {

        if self.wantsAnimationFrame == true && self.pendingRender == false {
            self.wantsAnimationFrame = false
            worker.dispatchExtendableEvent(self.canvasData!)
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
