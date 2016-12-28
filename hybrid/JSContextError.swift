//
//  JSContextError.swift
//  hybrid
//
//  Created by alastair.coote on 15/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

/// A wrapper that attempts to turn JSValue errors into Swift errors. Needs work.
class JSContextError : Error {
    let message:String
    let stack:String?
    
    init(message:String){
        self.message = message
        self.stack = nil
        
    }
    
    init(jsValue:JSValue) {
        if jsValue.isObject == true {
            let dict = jsValue.toObject() as! [String: AnyObject]
            if let message = dict["message"] {
                self.message = message as! String
                self.stack = nil
//                self.stack = dict["stack"]
            } else {
//                var msg = ""
//                for (key, val) in dict {
//                    msg = msg + key + " : " + (val as? String)
//                }
//                self.message = msg
                for (key, val) in dict {
                    NSLog("key? " + key + ": " + String(describing: val))
                }
                self.message = jsValue.toString()
                self.stack = nil
            }
        } else {
            self.message = jsValue.toString()
            self.stack = nil
        }
        
        
        
    }
    
}
