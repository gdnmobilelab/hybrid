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
    
//    var canvas:OffscreenCanvas
    
    init(width: Int, ratio: Float, worker: ServiceWorkerInstance) {
        
        let height = Int(Float(width) * ratio)
        self.worker = worker
        
        
        super.init(frame: CGRect(x: 0, y: 0, width: width, height: height))
        
        
        let canvas = OffscreenCanvas(width: width, height: height)
        canvas.getContext("2d")!.fillStyle = "#ffffff"
        canvas.getContext("2d")!.fillRect(0, y: 0, width: CGFloat(canvas.width), height: CGFloat(canvas.height))
        self.canvasData = CanvasEventData(canvas: canvas, targetView: self)
        
        self.requestAnimationFrame()
        
//        let test = CADisplayLink(target: self, selector: #selector(self.runUpdate))
//        test.addToRunLoop(NSRunLoop.mainRunLoop(), forMode: NSDefaultRunLoopMode)
        
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
        worker.dispatchExtendableEvent("notification-canvas", data: self.canvasData!)
            .then { _ -> Void in
                self.pendingRender = true
                self.setNeedsDisplay()
        }
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    var lastFrame:CGImage?
    
//    func getCanvasContext() -> Promise<CanvasEventData> {
//        if self.canvasData != nil {
//            return Promise<CanvasEventData>(self.canvasData!)
//        }
//        
//       
//        let canvas = OffscreenCanvas(width: 600, height: 400)
//        
//        // Canvas can be transparent by default, but we want it white
//        canvas.getContext("2d")!.fillStyle = "#ffffff"
//        canvas.getContext("2d")!.fillRect(0, y: 0, width: self.frame.width, height: self.frame.height)
//        
//        // It *appears* that iOS automatically flips context coordinates when inside
//        // drawRect(), but doesn't otherwise. If we wrap this up in a promise it actually executes
//        // outside of drawRect(), so if we manually apply a transform then we know we're
//        // drawing correctly.
//        
//        return Promise<Void>()
//        .then { () -> CanvasEventData in
//            
////            let transform = CGAffineTransformMake(
////                1, 0, 0, -1, 0, CGFloat(CGBitmapContextGetHeight(ctx))
////            )
////            
////            CGContextConcatCTM(ctx, transform)
//            
//            self.canvasData = CanvasEventData(canvas: canvas, targetView: self)
//            return self.canvasData!
//        }
//        
//    }
    
    var renderCount:Int = 0
    
    override func drawRect(rect: CGRect) {
        
        let ctx = self.canvasData!.canvas.getContext("2d")!.context
        
//        renderCount = renderCount + 1
//        CGContextSetFillColorWithColor(ctx, UIColor.whiteColor().CGColor)
//        CGContextFillRect(ctx, CGRect(x: 30 * self.renderCount, y: 30 * self.renderCount, width: 30, height: 30))
        
        UIGraphicsPushContext(ctx)
        
        let img = CGBitmapContextCreateImage(ctx)!
        
        UIGraphicsPopContext()
        
        CGContextDrawImage(UIGraphicsGetCurrentContext()!, rect, img)
        
        self.pendingRender = false
        
        
//        if self.canvasData == nil || 1 == 2 {
//            let canvas = OffscreenCanvas(existingContext: ctx)
//            
//            // Canvas can be transparent by default, but we want it white
//            canvas.getContext("2d")!.fillStyle = "#ffffff"
//            canvas.getContext("2d")!.fillRect(0, y: 0, width: CGFloat(canvas.width), height: CGFloat(canvas.height))
//            
//            self.canvasData = CanvasEventData(canvas: canvas, targetView: self)
////            self.requestAnimationFrame()
//        } else {
//                   }
//        
////        let isSame = UIGraphicsGetCurrentContext()! == self.canvasData!.canvas.getContext("2d")!.context
//        
        
        
        
//        let ctx = UIGraphicsGetCurrentContext()!
//        CGContextClearRect(ctx, rect)
//        
//        CGContextDrawImage(ctx, rect, self.canvasData!.canvas.getContext("2d")!.toImage())
//        NSLog("DRAW!")
//        CGContextDrawImage(UIGraphicsGetCurrentContext()!, rect, self.canvas.getContext("2d")!.toImage())
        
        
    }
    
   
//    override func drawLayer(layer: CALayer, inContext ctx: CGContext) {
//        NSLog("draw?")
//        CGContextDrawImage(ctx, self.frame, self.canvas.getContext("2d")!.toImage())
//        
//    }
    
}
