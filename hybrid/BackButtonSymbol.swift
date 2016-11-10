//
//  BackButtonSymbol.swift
//  hybrid
//
//  Created by alastair.coote on 27/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import CoreGraphics

class BackButtonSymbol: UIButton {
    
    var onTap:(() -> ())?
    
    convenience init(onTap:() -> ()) {
        self.init()
        self.onTap = onTap
    }
    
    init() {
        super.init(frame: CGRect())
        self.addTarget(self, action: #selector(self.tapped), forControlEvents: .TouchUpInside)
    }
    
    func tapped(sender: UIButton!) {
        if let tap = self.onTap {
            tap()
        }
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override var highlighted: Bool {
        get {
            return super.highlighted
        }
        
        set (value) {
            super.highlighted = value
            self.setNeedsDisplay()
        }
    }
    
    override func drawRect(rect: CGRect) {
        let height = rect.size.height * 0.65
        let width = height * 0.6
        
        let heightTranslate = (rect.size.height * 0.35) / 2
        
        let context = UIGraphicsGetCurrentContext()!
        
        CGContextTranslateCTM(context, 0, heightTranslate)
        
        CGContextBeginPath(context)
        CGContextMoveToPoint(context, width * 5.0/6.0, height * 0.0/10.0)
        CGContextAddLineToPoint(context, width * 0.0/6.0, height * 5.0/10.0)
        CGContextAddLineToPoint(context, width * 5.0/6.0, height * 10.0/10.0)
        CGContextAddLineToPoint(context, width * 6.0/6.0, height * 9.0/10.0)
        CGContextAddLineToPoint(context, width * 2.0/6.0, height * 5.0/10.0)
        CGContextAddLineToPoint(context, width * 6.0/6.0, height * 1.0/10.0)
        CGContextClosePath(context)
        
        let c = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: self.state == UIControlState.Highlighted ? 0.15 : 1)
        
        CGContextSetFillColorWithColor(context, c.CGColor)
        CGContextFillPath(context)
    }
}
