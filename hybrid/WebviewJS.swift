//
//  LoadingIndicatorJS.swift
//  hybrid
//
//  Created by alastair.coote on 04/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit

/// Kind of daft, but this class is a tiny store for JS snippets we use in the course of
/// loading webviews. It could be moved into js-src and injected into document-start.js
/// in the future, as all webviews should have access to it. Also hopefully Swift
/// introduces multi-line strings soon.
class WebviewJS {
    
    /// JavaScript to insert a 1px square in the top right of the view, to be used by RenderCheck to see if 
    /// the webview has painted onto the screen or not.
    static var setLoadingIndicator:String {
        get {
            
            // We use vw because if the webview doesn't have a scaling meta tag a 1px square
            // might not actually be 1px wide. Multiply by the width below to make it as small
            // as possible - should be able to use 100, but the scaling seems to anti-alias or something
            // and the colour doesn't look right.
            let width = String(200 / UIScreen.mainScreen().bounds.width)
            
            let js:[String] = [
                "var loadedIndicator = document.createElement('div');",
                "loadedIndicator.style.position = 'fixed';",
                "loadedIndicator.style.right = '0px';",
                "loadedIndicator.style.top = '0px';",
                "loadedIndicator.style.width = '" + width + "vw';",
                "loadedIndicator.style.height = '" + width + "vw';",
                "loadedIndicator.style.backgroundColor = '" + RenderCheck.colorToCheckFor.toRGBString() + "';",
                "loadedIndicator.style.zIndex = '999999';",
                "document.body.appendChild(loadedIndicator);",
                "window.__loadedIndicator = loadedIndicator;",
                "true" // have to return true otherwise js evaluate complains about trying to return a DOM node
            ]
            
            return js.joinWithSeparator("")
        }
    }
    
    
    /// Remove the loading indicator created by setLoadingIndicator()
    static var removeLoadingIndicator:String {
        get {
            return "document.body.removeChild(window.__loadedIndicator); delete window.__loadedIndicator; true;"
        }
    }
    
    
    /// Tiny script to grab the title, theme color and back URL from meta tags in the header
    static var getMetadataJS:String {
        get {
            return (["var getMeta = function(name) {",
                    "   var t = document.querySelector(\"meta[name='\" + name + \"']\");",
                    "   return t ? t.getAttribute('content') : null;",
                    "};",
                    "[getMeta('theme-color'), document.title, getMeta('default-back-url')]"
                    ] as [String]).joinWithSeparator("")
        }
    }
}
