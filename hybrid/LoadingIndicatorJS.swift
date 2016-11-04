//
//  LoadingIndicatorJS.swift
//  hybrid
//
//  Created by alastair.coote on 04/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class LoadingIndicatorJS {
    static var setIndicator:String {
        get {
            let js:[String] = [
                "loadedIndicator = document.createElement('div');",
                "loadedIndicator.style.position = 'absolute';",
                "loadedIndicator.style.right = '0px';",
                "loadedIndicator.style.top = '0px';",
                "loadedIndicator.style.width = '1px';",
                "loadedIndicator.style.height = '1px';",
                "loadedIndicator.style.backgroundColor = 'rgb(0,255,255)';",
                "loadedIndicator.style.zIndex = '999999';",
                "document.body.appendChild(loadedIndicator);",
                "window.__loadedIndicator = loadedIndicator;",
                "true" // have to return true otherwise js evaluate complains about trying to return a DOM node
            ]
            
            return js.joinWithSeparator("")
        }
    }
    
    static var removeIndicator:String {
        get {
            return "document.body.removeChild(window.__loadedIndicator); delete window.__loadedIndicator;"
        }
    }
}
