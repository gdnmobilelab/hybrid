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
    
    static let createImageBitmap = unsafeBitCast((ImageBitmap.createImageBitmapFunc) as @convention(block) (Data) -> JSPromise, to: AnyObject.self)
    
//    context.setObject(unsafeBitCast(fetchAsConvention, AnyObject.self), forKeyedSubscript: "fetch")
    
    init(data:Data) {
        let dataPtr = CFDataCreate(kCFAllocatorDefault, (data as NSData).bytes.bindMemory(to: UInt8.self, capacity: data.count), data.count)
        let dataProvider = CGDataProvider(data: dataPtr!)!
        image = CGImage(pngDataProviderSource: dataProvider, decode: nil, shouldInterpolate: true, intent: CGColorRenderingIntent.defaultIntent)!
    }
    
    init(image:CGImage) {
        self.image = image
    }
    
    var width:Int {
        get {
            return self.image.width
        }
    }
    
    var height:Int {
        get {
            return self.image.height
        }
    }
    
    fileprivate static func createImageBitmapFunc(_ data:Data) -> JSPromise {
        let ib = ImageBitmap(data: data)
        return JSPromise.resolve(ib)
    }
}
