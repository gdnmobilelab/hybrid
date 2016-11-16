//
//  HexColor.swift
//  hybrid
//
//  Created by alastair.coote on 16/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

/// Handling for colours specified as hex strings, as HTML colours tend to be. Is used by the Canvas classes
/// for setting fills, strokes, etc
class HexColor {
    
    let red:CGFloat
    let blue:CGFloat
    let green:CGFloat
    
    
    /// Create a new HexColor instance.
    ///
    /// - Parameter hexString: A hex colour string, with or without the starting #
    init(hexString:String) {
        let hexString:NSString = hexString.stringByTrimmingCharactersInSet(NSCharacterSet.whitespaceAndNewlineCharacterSet())
        let scanner = NSScanner(string: hexString as String)
        
        if (hexString.hasPrefix("#")) {
            scanner.scanLocation = 1
        }
        
        var color:UInt32 = 0
        scanner.scanHexInt(&color)
        
        let mask = 0x000000FF
        let r = Int(color >> 16) & mask
        let g = Int(color >> 8) & mask
        let b = Int(color) & mask
        
        red   = CGFloat(r) / 255.0
        green = CGFloat(g) / 255.0
        blue  = CGFloat(b) / 255.0
        
    }
    
    func toUIColor() -> UIColor {
        return UIColor(red: self.red, green: self.green, blue: self.blue, alpha: 1)
    }
    
    
    /// Return back to a hex string
    ///
    /// - Returns: Hex string, with a # prefix
    func toString() -> String {
        let rgb:Int = (Int)(red*255)<<16 | (Int)(green*255)<<8 | (Int)(blue*255)<<0
        
        return NSString(format:"#%06x", rgb) as String
    }
    
}
