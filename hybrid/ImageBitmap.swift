//
//  ImageBitmap.swift
//  hybrid
//
//  Created by alastair.coote on 21/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import CoreGraphics
import JavaScriptCore

@objc protocol ImageBitmapExports : JSExport {
    var width:Int {get}
    var height:Int {get}
}

@objc class ImageBitmap : NSObject, ImageBitmapExports {
    
    let image:CGImage
    
    static let createImageBitmap = unsafeBitCast((ImageBitmap.createImageBitmapFunc) as @convention(block) (NSData) -> JSPromise, AnyObject.self)
    
//    context.setObject(unsafeBitCast(fetchAsConvention, AnyObject.self), forKeyedSubscript: "fetch")
    
    init(data:NSData) {
        let dataPtr = CFDataCreate(kCFAllocatorDefault, UnsafePointer<UInt8>(data.bytes), data.length)
        let dataProvider = CGDataProviderCreateWithCFData(dataPtr)!
        image = CGImageCreateWithPNGDataProvider(dataProvider, nil, true, CGColorRenderingIntent.RenderingIntentDefault)!
    }
    
    init(image:CGImage) {
        self.image = image
    }
    
    var width:Int {
        get {
            return CGImageGetWidth(self.image)
        }
    }
    
    var height:Int {
        get {
            return CGImageGetHeight(self.image)
        }
    }
    
    private static func createImageBitmapFunc(data:NSData) -> JSPromise {
        let ib = ImageBitmap(data: data)
        return JSPromise.resolve(ib)
    }
}
