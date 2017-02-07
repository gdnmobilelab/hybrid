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
    
    @objc(translate::)
    func translate(_ x: CGFloat, y: CGFloat)
    
    func rotate(_ angle: CGFloat)
    
    func save()
    
    func restore()
    
    @objc(clearRect::::)
    func clearRect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    @objc(fillRect::::)
    func fillRect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    @objc(strokeRect::::)
    func strokeRect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    func beginPath()
    func closePath()
    
    @objc(moveTo::)
    func moveTo(_ x:CGFloat, y:CGFloat)
    
    @objc(lineTo::)
    func lineTo(_ x:CGFloat, y:CGFloat)
    
    @objc(bezierCurveTo::::::)
    func bezierCurveTo(_ cp1x:CGFloat, cp1y:CGFloat, cp2x: CGFloat, cp2y:CGFloat, x:CGFloat, y:CGFloat)
    
    @objc(quadraticCurveTo::::)
    func quadraticCurveTo(_ cpx:CGFloat, cpy:CGFloat, x:CGFloat, y:CGFloat)
    
    @objc(rect::::)
    func rect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat)
    
    @objc(arc::::::)
    func arc(_ x:CGFloat, y: CGFloat, radius:CGFloat, startAngle: CGFloat, endAngle:CGFloat, antiClockwise:Bool)
    
    @objc(arcTo:::::)
    func arcTo(_ x1:CGFloat, y1: CGFloat, x2: CGFloat, y2:CGFloat, radius: CGFloat)
    
    func fill()
    func stroke()
    
    @objc(drawImage:::::::::)
    func drawImage(_ bitmap:JSValue, arg1: JSValue, arg2: JSValue, arg3: JSValue, arg4: JSValue, arg5:JSValue, arg6: JSValue, arg7:JSValue, arg8:JSValue)
    
    var fillStyle:String {get set }
    var strokeStyle:String {get set}
    var lineWidth:Float {get set}
    var globalAlpha:CGFloat {get set}
    
    func setLineDash(_ dashes:[CGFloat]?)
    
}

@objc class OffscreenCanvasRenderingContext2D: NSObject, OffscreenCanvasRenderingContext2DExports {
    
    let context: CGContext
    
    required init(width: Int, height: Int) {
        let colorSpace = CGColorSpaceCreateDeviceRGB()
        self.context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: 0, space: colorSpace, bitmapInfo: CGBitmapInfo(rawValue: CGImageAlphaInfo.premultipliedLast.rawValue).rawValue)!
    }
    
    
    init(context:CGContext) {
        self.context = context;
    }
    
    @objc(translate::)
    func translate(_ x: CGFloat, y:CGFloat) {
        self.context.translateBy(x: x, y: y)
    }
    
    func rotate(_ angle:CGFloat) {
        self.context.rotate(by: angle)
    }
    
    func save() {
        self.context.saveGState()
    }
    
    func restore() {
        self.context.restoreGState()
    }
    
    func toImage() -> CGImage {
        let imageRef = self.context.makeImage()
        return imageRef!
    }
    
    
    
    @objc(clearRect::::)
    func clearRect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        self.context.clear(CGRect(x: x, y: y, width: width, height: height))
        
    }
    
    @objc(fillRect::::)
    func fillRect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        self.context.fill(CGRect(x: x, y: y, width: width, height: height))
    }
    
    @objc(strokeRect::::)
    func strokeRect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        self.context.stroke(CGRect(x: x, y: y, width: width, height: height))
    }
    
    func beginPath() {
        self.context.beginPath()
    }
    
    func closePath() {
        self.context.closePath()
    }
    
    @objc(moveTo::)
    func moveTo(_ x:CGFloat, y:CGFloat) {
        self.context.move(to: CGPoint(x: x, y: y))
    }
    
    @objc(lineTo::)
    func lineTo(_ x:CGFloat, y:CGFloat) {
        self.context.addLine(to: CGPoint(x: x, y: y))
    }
    
    @objc(bezierCurveTo::::::)
    func bezierCurveTo(_ cp1x:CGFloat, cp1y:CGFloat, cp2x: CGFloat, cp2y:CGFloat, x:CGFloat, y:CGFloat) {
        self.context.addCurve(to: CGPoint(x: x, y: y), control1: CGPoint(x: cp1x, y: cp1y), control2: CGPoint(x: cp2x, y: cp2y))
    }
    
    @objc(quadraticCurveTo::::)
    func quadraticCurveTo(_ cpx:CGFloat, cpy:CGFloat, x:CGFloat, y:CGFloat) {
        self.context.addQuadCurve(to: CGPoint(x:x, y:y), control: CGPoint(x: cpx, y:cpy))
    }
    
    @objc(rect::::)
    func rect(_ x: CGFloat, y: CGFloat, width: CGFloat, height: CGFloat) {
        self.context.addRect(CGRect(x: x, y: y, width: width, height: height))
    }
    
    @objc(arc::::::)
    func arc(_ x:CGFloat, y: CGFloat, radius:CGFloat, startAngle: CGFloat, endAngle:CGFloat, antiClockwise:Bool) {
        self.context.addArc(center: CGPoint(x: x, y: y), radius: radius, startAngle: startAngle, endAngle: endAngle, clockwise: !antiClockwise)
    }
    
    @objc(arcTo:::::)
    func arcTo(_ x1:CGFloat, y1: CGFloat, x2: CGFloat, y2:CGFloat, radius: CGFloat) {
        self.context.addArc(tangent1End: CGPoint(x: x1, y:y1), tangent2End: CGPoint(x: x2, y: y2), radius: radius)
    }
    
    func fill() {
        self.context.fillPath()
    }
    
    func stroke() {
        self.context.strokePath()
    }
    
    func getBitmapFromArgument(_ arg:JSValue) -> ImageBitmap? {
        
        var targetBitmap:ImageBitmap?
        
        if arg.isInstance(of: ImageBitmap.self) {
            targetBitmap = arg.toObjectOf(ImageBitmap.self) as? ImageBitmap
        } else if arg.isInstance(of: OffscreenCanvas.self) {
            let canvas = arg.toObjectOf(OffscreenCanvas.self) as! OffscreenCanvas
            targetBitmap = ImageBitmap(image: canvas.getContext("2d")!.toImage())
        }
        
        return targetBitmap
    }
    
    func drawImage(_ bitmap:ImageBitmap, dx: CGFloat, dy: CGFloat) {
        self.drawImage(bitmap, dx: dx, dy: dy, dWidth: CGFloat(bitmap.width), dHeight: CGFloat(bitmap.height))
    }
    
    func drawImage(_ bitmap:ImageBitmap, dx: CGFloat, dy: CGFloat, dWidth:CGFloat, dHeight: CGFloat) {
        
        // -dy because of this transform stuff
        
        let canvasHeight = CGFloat(self.context.height)
        
        let destRect = CGRect(x: dx, y: canvasHeight - dHeight - dy, width: dWidth, height: dHeight)
        
        // Have to do this to avoid image drawing upside down
        
        
        self.context.saveGState()
        
        let flipVertical:CGAffineTransform = CGAffineTransform(a: 1,b: 0,c: 0,d: -1,tx: 0, ty: canvasHeight)
        context.concatenate(flipVertical)
        
        //        CGContextScaleCTM(self.context, 1.0, -1.0)
        //        CGContextTranslateCTM(self.context, 0, CGFloat(bitmap.height))
        //
        
        self.context.draw(bitmap.image, in: destRect)
        
        self.context.restoreGState()
        //
        //        CGContextScaleCTM(self.context, -1.0, 1.0)
        //        CGContextTranslateCTM(self.context, 0, CGFloat(-bitmap.height))
    }
    
    @objc(drawImage:::::::::)
    func drawImage(_ bitmap:JSValue, arg1: JSValue, arg2: JSValue, arg3: JSValue, arg4: JSValue, arg5:JSValue, arg6: JSValue, arg7:JSValue, arg8:JSValue) {
        
        let targetBitmap = getBitmapFromArgument(bitmap)
        
        if arg8.isUndefined == false {
            // it's the 8 arg variant
            
            self.drawImage(
                targetBitmap!,
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
                targetBitmap!,
                dx: CGFloat(arg1.toDouble()),
                dy: CGFloat(arg2.toDouble()),
                dWidth: CGFloat(arg3.toDouble()),
                dHeight: CGFloat(arg4.toDouble())
            )
        } else {
            self.drawImage(
                targetBitmap!,
                dx: CGFloat(arg1.toDouble()),
                dy: CGFloat(arg2.toDouble())
            )
        }
        
        
    }
    
    func drawImage(_ bitmap:ImageBitmap, sx: CGFloat, sy: CGFloat, sWidth: CGFloat, sHeight: CGFloat, dx:CGFloat, dy: CGFloat, dWidth:CGFloat, dHeight:CGFloat) {
        
        let sourceRect = CGRect(x: sx, y: sy, width: sWidth, height: sHeight)
        
        let imgCrop = bitmap.image.cropping(to: sourceRect)!
        
        let bitmapCrop = ImageBitmap(image: imgCrop)
        
        self.drawImage(bitmapCrop, dx: dx, dy: dy, dWidth: dWidth, dHeight: dHeight)
    }
    
    
    fileprivate var fillStyleColor = HexColor(hexString: "#000000")
    
    var fillStyle:String {
        
        get {
            return fillStyleColor.toString()
        }
        
        set {
            self.fillStyleColor = HexColor(hexString: newValue)
            self.context.setFillColor(red: self.fillStyleColor.red, green: self.fillStyleColor.green, blue: self.fillStyleColor.blue, alpha: 1)
        }
        
    }
    
    fileprivate var strokeStyleColor = HexColor(hexString: "#000000")
    
    var strokeStyle:String {
        
        get {
            return strokeStyleColor.toString()
        }
        
        set {
            self.strokeStyleColor = HexColor(hexString: newValue)
            
            self.context.setStrokeColor(red: self.strokeStyleColor.red, green: self.strokeStyleColor.green, blue: self.strokeStyleColor.blue, alpha: 1)
        }
        
    }
    
    // We can't get line width back out of CGContext, so we store a reference here too
    fileprivate var currentLineWidth:Float = 1.0
    
    var lineWidth:Float {
        get {
            return self.currentLineWidth
        }
        
        set {
            self.currentLineWidth = newValue
            self.context.setLineWidth(CGFloat(newValue))
        }
    }
    
    fileprivate var currentGlobalAlpha:CGFloat = 1.0
    
    var globalAlpha:CGFloat {
        get {
            return currentGlobalAlpha
        }
        set(value) {
            currentGlobalAlpha = value
            self.context.setAlpha(value)
        }
    }
    
    func setLineDash(_ dashes:[CGFloat]?) {
        
        if dashes == nil {
            
            self.context.setLineDash(phase: 0, lengths: [])
        } else {
            self.context.setLineDash(phase: 0, lengths: dashes!)
        }
    }
    
}
