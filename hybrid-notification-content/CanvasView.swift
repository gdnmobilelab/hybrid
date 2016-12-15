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

enum NotificationCanvasEventType {
    case New
    case Frame
}

@objc protocol NotificationCanvasEventExports: JSExport {
    var canvas: OffscreenCanvas {get}
    func requestAnimationFrame()
}

@objc class NotificationCanvasEvent : ExtendableEvent, NotificationCanvasEventExports {
    
    let canvas:OffscreenCanvas
    let targetView:CanvasView
    
    init(canvas:OffscreenCanvas, targetView: CanvasView, type:NotificationCanvasEventType) {
        self.canvas = canvas
        self.targetView = targetView
        super.init(type: type == NotificationCanvasEventType.New ? "notificationcanvasshow" : "notificationcanvasframe" )
    }
    
    required init(type: String) {
        fatalError("init(type:) has not been implemented")
    }
    
    func requestAnimationFrame() {
        self.targetView.requestAnimationFrame()
    }

}

class CanvasView: UIView {
    
//    private var canvasData: CanvasEvent?
    private let canvas:OffscreenCanvas
    private let worker: ServiceWorkerInstance
    private var displayLink:CADisplayLink?
    
    private static func multiplyByRatio(num:CGFloat) -> Int {
        return Int(num * UIScreen.mainScreen().scale)
    }
    
    init(width: CGFloat, ratio: CGFloat, worker: ServiceWorkerInstance) {
        
        let height = width * ratio
        self.worker = worker
        
        self.canvas = OffscreenCanvas(width: CanvasView.multiplyByRatio(width), height: CanvasView.multiplyByRatio(height))
        self.canvas.getContext("2d")!.fillStyle = "#ffffff"
        self.canvas.getContext("2d")!.fillRect(0, y: 0, width: CGFloat(canvas.width), height: CGFloat(canvas.height))
//        self.canvasData = CanvasEvent(canvas: canvas, targetView: self)
        
        super.init(frame: CGRect(x: 0, y: 0, width: Int(width), height: Int(height)))
        
        let initialEvent = NotificationCanvasEvent(canvas: self.canvas, targetView: self, type: NotificationCanvasEventType.New)
        worker.dispatchExtendableEvent(initialEvent)
        .then { _ -> Void in
            self.pendingRender = true
            self.setNeedsDisplay()
        }
        .error { error in
            log.error("Error in rendering canvas: " + String(error))
        }
        
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
            let frameEvent = NotificationCanvasEvent(canvas: self.canvas, targetView: self, type: NotificationCanvasEventType.Frame)
            worker.dispatchExtendableEvent(frameEvent)
            .then { _ -> Void in
                self.pendingRender = true
                self.setNeedsDisplay()
            }
            .error { error in
                log.error("Error in rendering canvas: " + String(error))
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
        
        let ctx = self.canvas.getContext("2d")!.context
        
        UIGraphicsPushContext(ctx)
        
        let img = CGBitmapContextCreateImage(ctx)!
        
        UIGraphicsPopContext()
        
        CGContextDrawImage(UIGraphicsGetCurrentContext()!, rect, img)
        
        self.pendingRender = false
    }
    
    
}
