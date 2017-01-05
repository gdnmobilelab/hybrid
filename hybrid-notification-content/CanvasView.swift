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

//enum NotificationCanvasEventType {
//    case New
//    case Frame
//}

//@objc protocol NotificationCanvasEventExports: JSExport {
//    var canvas: OffscreenCanvas {get}
//    var notification: Notification {get}
//    func requestAnimationFrame()
//}
//
//@objc class NotificationCanvasEvent : ExtendableEvent, NotificationCanvasEventExports {
//    
//    let canvas:OffscreenCanvas
//    let notification:Notification
//    let targetView:CanvasView
//    
//    init(canvas:OffscreenCanvas, notification:Notification, targetView: CanvasView, type:NotificationCanvasEventType) {
//        self.canvas = canvas
//        self.targetView = targetView
//        self.notification = notification
//        super.init(type: type == NotificationCanvasEventType.New ? "notificationcanvasshow" : "notificationcanvasframe" )
//    }
//    
//    required init(type: String) {
//        fatalError("init(type:) has not been implemented")
//    }
//    
//    func requestAnimationFrame() {
//        self.targetView.requestAnimationFrame()
//    }
//
//}

class CanvasView: UIView {
    
//    private var canvasData: CanvasEvent?
    let canvas:OffscreenCanvas
    fileprivate let worker: ServiceWorkerInstance
    fileprivate var displayLink:CADisplayLink?
    fileprivate let notification:Notification
    let proportion:CGFloat
    
    fileprivate static func multiplyByRatio(_ num:CGFloat) -> Int {
        return Int(num * UIScreen.main.scale)
    }
    
    init(width: CGFloat, proportion: CGFloat, worker: ServiceWorkerInstance, notification:Notification) {
        
        let height = width / proportion
        self.worker = worker
        
        self.proportion = proportion
        
        self.notification = notification
        
        self.canvas = OffscreenCanvas(width: CanvasView.multiplyByRatio(width), height: CanvasView.multiplyByRatio(height))
        
        super.init(frame: CGRect(x: 0, y: 0, width: Int(width), height: Int(height)))
        
        self.canvas.requestAnimationFrame = self.requestAnimationFrame
        
        self.isOpaque = false
        
        self.displayLink = CADisplayLink(target: self, selector: #selector(self.runUpdate))
        self.displayLink!.add(to: RunLoop.main, forMode: RunLoopMode.defaultRunLoopMode)
        
    }
    
    override func removeFromSuperview() {
        super.removeFromSuperview()
        self.displayLink!.remove(from: RunLoop.main, forMode: RunLoopMode.defaultRunLoopMode)
    }
    
    var wantsAnimationFrame:Bool = false
    var pendingRender = false
    
    func runUpdate() {

        if self.wantsAnimationFrame == true && self.pendingRender == false {
            self.wantsAnimationFrame = false
            let frameEvent = NotificationEvent(type: "notificationcanvasframe", notification: self.notification)
            
            worker.dispatchExtendableEvent(frameEvent)
            .then { _ -> Void in
                self.pendingRender = true
                self.setNeedsDisplay()
            }
            .catch { error in
                log.error("Error in rendering canvas: " + String(describing: error))
            }
        }
        
    }
    
    func requestAnimationFrame() {
        self.wantsAnimationFrame = true
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    
    override func draw(_ rect: CGRect) {
        
        let ctx = self.canvas.getContext("2d")!.context
        
        UIGraphicsPushContext(ctx)
        
        let img = ctx.makeImage()!
        
        UIGraphicsPopContext()
        
        UIGraphicsGetCurrentContext()!.draw(img, in: rect)
        
        self.pendingRender = false
    }
    
    
}
