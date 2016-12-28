//
//  NotificationTextView.swift
//  hybrid
//
//  Created by alastair.coote on 14/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

class NotificationTextView : UIView {
    
    init(title: String, body: String, frame: CGRect) {
        
        super.init(frame: CGRect(x:0,y:0,width: frame.width, height: 0))
        
        let targetWidth = self.frame.width - 30
        
        let titleView = UILabel()
        titleView.text = title
        
        titleView.frame.size.width = targetWidth
        titleView.frame.origin.x = 15
        titleView.frame.origin.y = 15
        titleView.lineBreakMode = NSLineBreakMode.ByWordWrapping
        titleView.numberOfLines = 0
        
        let desc = titleView.font.fontDescriptor().fontDescriptorWithSymbolicTraits(UIFontDescriptorSymbolicTraits.TraitBold)
        titleView.font = UIFont(descriptor: desc!, size: UIFont.labelFontSize())
        titleView.sizeToFit()
        
        let bodyView = UILabel()
        bodyView.text = body
        bodyView.frame.size.width = targetWidth
        bodyView.frame.origin.x = titleView.frame.origin.x
        bodyView.lineBreakMode = NSLineBreakMode.ByWordWrapping
        bodyView.numberOfLines = 0
        bodyView.textColor = UIColor(hue: 51 / 255, saturation: 51 / 255, brightness: 51 / 255, alpha: 1)
        bodyView.sizeToFit()
        bodyView.frame.origin.y = titleView.frame.height + 15
        
        self.addSubview(titleView)
        self.addSubview(bodyView)
        self.frame.size.height = bodyView.frame.maxY + 15
        
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
}
