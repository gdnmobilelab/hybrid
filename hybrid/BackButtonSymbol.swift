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


/// Not currently used, but the BackButtonSymbol is for when we want to manually create the back button
/// on our controllers. This will allow us to remove the "flash" when the back button appears.
class BackButtonSymbol: UIButton {
    
    var onTap:(() -> ())?
    
    convenience init(onTap:@escaping () -> ()) {
        self.init()
        self.onTap = onTap
    }
    
    init() {
        super.init(frame: CGRect())
        self.addTarget(self, action: #selector(self.tapped), for: .touchUpInside)
        self.backgroundColor = UIColor.green
    }
    
    func tapped(_ sender: UIButton!) {
        if let tap = self.onTap {
            tap()
        }
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override var isHighlighted: Bool {
        get {
            return super.isHighlighted
        }
        
        set (value) {
            super.isHighlighted = value
            self.setNeedsDisplay()
        }
    }
    
    override func draw(_ rect: CGRect) {
        let height = rect.size.height * 0.65
        let width = height * 0.6
        
        let heightTranslate = (rect.size.height * 0.35) / 2
        
        let context = UIGraphicsGetCurrentContext()!
        
        context.translateBy(x: 0, y: heightTranslate)
        
        context.beginPath()
        context.move(to: CGPoint(x: width * 5.0/6.0, y: height * 0.0/10.0))
        context.addLine(to: CGPoint(x: width * 0.0/6.0, y: height * 5.0/10.0))
        context.addLine(to: CGPoint(x: width * 5.0/6.0, y: height * 10.0/10.0))
        context.addLine(to: CGPoint(x: width * 6.0/6.0, y: height * 9.0/10.0))
        context.addLine(to: CGPoint(x: width * 2.0/6.0, y: height * 5.0/10.0))
        context.addLine(to: CGPoint(x: width * 6.0/6.0, y: height * 1.0/10.0))
        context.closePath()
        
        let c = UIColor(red: 1.0, green: 1.0, blue: 1.0, alpha: self.state == UIControlState.highlighted ? 0.15 : 1)
        
        context.setFillColor(c.cgColor)
        context.fillPath()
    }
}
