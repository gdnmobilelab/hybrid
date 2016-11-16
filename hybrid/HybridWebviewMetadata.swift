//
//  HybridWebviewMetadata.swift
//  hybrid
//
//  Created by alastair.coote on 16/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit


/// Metadata extracted from a webview, mostly from tags in the <head>
struct HybridWebviewMetadata {
    
    /// The color of the title bar in the app. Taken from the "theme-color" tag used in Chrome
    var color:UIColor?
    var title:String
    
    /// Custom meta tag used by hybrid, name is "default-back-url". Used to create a back view
    /// when there is no existing view stack.
    var defaultBackURL:String?
    
    init() {
        title = ""
    }
}
