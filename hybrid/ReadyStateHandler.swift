//
//  LoadHandler.swift
//  hybrid
//
//  Created by alastair.coote on 07/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit

class ReadyStateHandler: NSObject, WKScriptMessageHandler {
    
    static let name = "readyStateHandler"
    
    var onchange: ((String) -> ())?
    
    @objc func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        
        if self.onchange != nil {
            self.onchange!(message.body as! String)
        }
        
    }
}
