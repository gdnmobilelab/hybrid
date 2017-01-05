//
//  NavigationBarBottomBorder.swift
//  hybrid
//
//  Created by alastair.coote on 05/01/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

extension UINavigationBar {
    
    func setBottomBorderColor(color: UIColor) {
        
        var bottomBorderView = self.viewWithTag(991231)
        
        if bottomBorderView == nil {
            bottomBorderView = UIView(frame: CGRect(x: 0, y: 0, width: 0, height: 0))
            bottomBorderView!.translatesAutoresizingMaskIntoConstraints = false
            bottomBorderView!.tag = 991231
            
            self.addSubview(bottomBorderView!)
            
            let views: [String: UIView] = ["border": bottomBorderView!]
            
            var allConstraints = NSLayoutConstraint.constraints(withVisualFormat: "H:|[border]|", options: [], metrics: nil, views: views)
            
            
            allConstraints.append(NSLayoutConstraint(item: bottomBorderView!, attribute: .height, relatedBy: .equal, toItem: nil, attribute: .notAnAttribute, multiplier: 1.0, constant: 1))
            allConstraints.append(NSLayoutConstraint(item: bottomBorderView!, attribute: .bottom, relatedBy: .equal, toItem: self, attribute: .bottom, multiplier: 1.0, constant: 1))
            
            NSLayoutConstraint.activate(allConstraints)

        }
        
        bottomBorderView!.backgroundColor = color
        
    }
}
