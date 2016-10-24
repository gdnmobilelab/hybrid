//
//  CanvasView.swift
//  hybrid
//
//  Created by alastair.coote on 21/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

class CanvasView: UIView {
    
    private let canvas:OffscreenCanvas
    
    init(width: Int, ratio: Float, worker: ServiceWorkerInstance) {
        
        let height = Int(Float(width) * ratio)
        self.canvas = OffscreenCanvas(width: width, height: height)
        
        super.init(frame: CGRect(x: 0, y: 0, width: width, height: height))
        
        // Canvas can be transparent by default, but we want it white
        self.canvas.getContext("2d")!.fillStyle = "#ffffff"
        self.canvas.getContext("2d")!.fillRect(0, y: 0, width: self.frame.width, height: self.frame.height)
        
        self.setNeedsLayout()
        self.setNeedsDisplay()
        
        worker.dispatchExtendableEvent("notification-canvas", data: [
            "canvas": self.canvas
        ])
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func drawRect(rect: CGRect) {
        let ctx = UIGraphicsGetCurrentContext()!
        CGContextDrawImage(ctx, self.frame, self.canvas.getContext("2d")!.toImage())
//        CGContextSetRGBFillColor(ctx, 1, 0, 0, 1)
//        CGContextFillRect(ctx, CGRect(x: 10,y: 10,width: 40,height: 40))
    }
    
   
//    override func drawLayer(layer: CALayer, inContext ctx: CGContext) {
//        NSLog("draw?")
//        CGContextDrawImage(ctx, self.frame, self.canvas.getContext("2d")!.toImage())
//        
//    }
    
}
