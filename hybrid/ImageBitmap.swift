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
    static func createImageBitmap(data:NSData, callback:JSValue, errorCallback: JSValue)
}

@objc class ImageBitmap : NSObject, ImageBitmapExports {
    
    let image:CGImage
    
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
    
    static func createImageBitmap(data:NSData, callback:JSValue, errorCallback: JSValue) {
        let ib = ImageBitmap(data: data)
        callback.callWithArguments([ib])
    }
}
