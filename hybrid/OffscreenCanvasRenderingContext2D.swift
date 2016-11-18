//
//  CanvasRenderingContext2D.swift
//  hybrid
//
//  Created by alastair.coote on 17/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import UIKit

@objc protocol OffscreenCanvasRenderingContext2DExports : JSExport {
    init(width: Int, height: Int)
    
    @objc(clearRect::::)
    func clearRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    @objc(fillRect::::)
    func fillRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    @objc(strokeRect::::)
    func strokeRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    func beginPath()
    func closePath()
    
    @objc(moveTo::)
    func moveTo(x:CGFloat, y:CGFloat)
    
    @objc(lineTo::)
    func lineTo(x:CGFloat, y:CGFloat)
    
    @objc(bezierCurveTo::::::)
    func bezierCurveTo(cp1x:CGFloat, cp1y:CGFloat, cp2x: CGFloat, cp2y:CGFloat, x:CGFloat, y:CGFloat)
    
    @objc(quadraticCurveTo::::)
    func quadraticCurveTo(cpx:CGFloat, cpy:CGFloat, x:CGFloat, y:CGFloat)
    
    @objc(rect::::)
    func rect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    @objc(arc::::::)
    func arc(x:CGFloat, y: CGFloat, radius:CGFloat, startAngle: CGFloat, endAngle:CGFloat, antiClockwise:Bool)
    
    @objc(arcTo:::::)
    func arcTo(x1:CGFloat, y1: CGFloat, x2: CGFloat, y2:CGFloat, radius: CGFloat)
    
    func fill()
    func stroke()
    
    @objc(drawImage:::::::::)
    func drawImage(bitmap:ImageBitmap, arg1: JSValue, arg2: JSValue, arg3: JSValue, arg4: JSValue, arg5:JSValue, arg6: JSValue, arg7:JSValue, arg8:JSValue)
    
    var fillStyle:String {get set }
    var strokeStyle:String {get set}
    var lineWidth:Float {get set}
    
}

@objc class OffscreenCanvasRenderingContext2D: NSObject, OffscreenCanvasRenderingContext2DExports {
    
    let context: CGContext
    
    required init(width: Int, height: Int) {
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        self.context = CGBitmapContextCreate(nil, width, height, 8, 0, colorSpace, CGBitmapInfo(rawValue: CGImageAlphaInfo.PremultipliedLast.rawValue).rawValue)!
    }
    
    
    init(context:CGContext) {
        self.context = context;
    }
    
    func toImage() -> CGImage {
        let imageRef = CGBitmapContextCreateImage(self.context)
        return imageRef!
    }
    
    @objc(clearRect::::)
    func clearRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        //CGContextClearRect(self.context, CGRect(x: x, y: y, width: width, height: height))
        
        // don't actually use clear, as it results in black box
        
        let fill = self.fillStyle
        self.fillStyle = "#ffffff"
        self.fillRect(x, y: y, width: width, height: height)
        self.fillStyle = fill
    }
    
    @objc(fillRect::::)
    func fillRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        CGContextFillRect(self.context, CGRect(x: x, y: y, width: width, height: height))
    }
    
    @objc(strokeRect::::)
    func strokeRect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        CGContextStrokeRect(self.context, CGRect(x: x, y: y, width: width, height: height))
    }
    
    func beginPath() {
        CGContextBeginPath(self.context)
    }
    
    func closePath() {
        CGContextClosePath(self.context)
    }
    
    @objc(moveTo::)
    func moveTo(x:CGFloat, y:CGFloat) {
        CGContextMoveToPoint(self.context, x, y)
    }
    
    @objc(lineTo::)
    func lineTo(x:CGFloat, y:CGFloat) {
        CGContextAddLineToPoint(self.context, x, y)
    }
    
    @objc(bezierCurveTo::::::)
    func bezierCurveTo(cp1x:CGFloat, cp1y:CGFloat, cp2x: CGFloat, cp2y:CGFloat, x:CGFloat, y:CGFloat) {
        CGContextAddCurveToPoint(self.context, cp1x, cp1y, cp2x, cp2y, x, y)
    }
    
    @objc(quadraticCurveTo::::)
    func quadraticCurveTo(cpx:CGFloat, cpy:CGFloat, x:CGFloat, y:CGFloat) {
        CGContextAddQuadCurveToPoint(self.context, cpx, cpy, x, y)
    }
    
    @objc(rect::::)
    func rect(x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        CGContextAddRect(self.context, CGRect(x: x, y: y, width: width, height: height))
    }
    
    @objc(arc::::::)
    func arc(x:CGFloat, y: CGFloat, radius:CGFloat, startAngle: CGFloat, endAngle:CGFloat, antiClockwise:Bool) {
        CGContextAddArc(self.context, x, y, radius, startAngle, endAngle, antiClockwise ? 1 : 0)
    }
    
    @objc(arcTo:::::)
    func arcTo(x1:CGFloat, y1: CGFloat, x2: CGFloat, y2:CGFloat, radius: CGFloat) {
        CGContextAddArcToPoint(self.context, x1, y1, x2, y2, radius)
    }
    
    func fill() {
        CGContextFillPath(self.context)
    }
    
    func stroke() {
        CGContextStrokePath(self.context)
    }
    
    func drawImage(bitmap:ImageBitmap, dx: CGFloat, dy: CGFloat) {
        self.drawImage(bitmap, dx: dx, dy: dy, dWidth: CGFloat(bitmap.width), dHeight: CGFloat(bitmap.height))
    }
    
    func drawImage(bitmap:ImageBitmap, dx: CGFloat, dy: CGFloat, dWidth:CGFloat, dHeight: CGFloat) {
        
        // -dy because of this transform stuff
        
        let destRect = CGRect(x: dx, y: -dy, width: dWidth, height: dHeight)
        
        // Have to do this to avoid image drawing upside down
        
        
        CGContextSaveGState(self.context)
        
        CGContextTranslateCTM(self.context, 0, CGFloat(bitmap.height))
        CGContextScaleCTM(self.context, 1.0, -1.0)
        
        CGContextDrawImage(self.context, destRect, bitmap.image)
        
        CGContextRestoreGState(self.context)
        //
        //        CGContextScaleCTM(self.context, -1.0, 1.0)
        //        CGContextTranslateCTM(self.context, 0, CGFloat(-bitmap.height))
    }
    
    @objc(drawImage:::::::::)
    func drawImage(bitmap:ImageBitmap, arg1: JSValue, arg2: JSValue, arg3: JSValue, arg4: JSValue, arg5:JSValue, arg6: JSValue, arg7:JSValue, arg8:JSValue) {
        
        if arg8.isUndefined == false {
            // it's the 8 arg variant
            
            self.drawImage(
                bitmap,
                sx: CGFloat(arg1.toDouble()),
                sy: CGFloat(arg2.toDouble()),
                sWidth: CGFloat(arg3.toDouble()),
                sHeight: CGFloat(arg4.toDouble()),
                dx: CGFloat(arg5.toDouble()),
                dy: CGFloat(arg6.toDouble()),
                dWidth: CGFloat(arg7.toDouble()),
                dHeight: CGFloat(arg8.toDouble())
            )
        } else if arg4.isUndefined == false {
            
            self.drawImage(
                bitmap,
                dx: CGFloat(arg1.toDouble()),
                dy: CGFloat(arg2.toDouble()),
                dWidth: CGFloat(arg3.toDouble()),
                dHeight: CGFloat(arg4.toDouble())
            )
        } else {
            self.drawImage(
                bitmap,
                dx: CGFloat(arg1.toDouble()),
                dy: CGFloat(arg2.toDouble())
            )
        }
        
        
    }
    
    func drawImage(bitmap:ImageBitmap, sx: CGFloat, sy: CGFloat, sWidth: CGFloat, sHeight: CGFloat, dx:CGFloat, dy: CGFloat, dWidth:CGFloat, dHeight:CGFloat) {
        
        let sourceRect = CGRect(x: sx, y: sy, width: sWidth, height: sHeight)
        
        let imgCrop = CGImageCreateWithImageInRect(bitmap.image, sourceRect)!
        
        let bitmapCrop = ImageBitmap(image: imgCrop)
        
        self.drawImage(bitmapCrop, dx: dx, dy: dy, dWidth: dWidth, dHeight: dHeight)
    }
    
    
    private var fillStyleColor = HexColor(hexString: "#000000")
    
    var fillStyle:String {
        
        get {
            return fillStyleColor.toString()
        }
        
        set {
            self.fillStyleColor = HexColor(hexString: newValue)
            CGContextSetRGBFillColor(self.context, self.fillStyleColor.red, self.fillStyleColor.green, self.fillStyleColor.blue, 1)
        }
        
    }
    
    private var strokeStyleColor = HexColor(hexString: "#000000")
    
    var strokeStyle:String {
        
        get {
            return strokeStyleColor.toString()
        }
        
        set {
            self.strokeStyleColor = HexColor(hexString: newValue)
            CGContextSetRGBFillColor(self.context, self.strokeStyleColor.red, self.strokeStyleColor.green, self.strokeStyleColor.blue, 1)
        }
        
    }
    
    // We can't get line width back out of CGContext, so we store a reference here too
    private var currentLineWidth:Float = 1.0
    
    var lineWidth:Float {
        get {
            return self.currentLineWidth
        }
        
        set {
            self.currentLineWidth = newValue
            CGContextSetLineWidth(self.context, CGFloat(newValue))
        }
    }
    
}
