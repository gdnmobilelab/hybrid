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
class JSContextError : ErrorType {
    let message:String
    let stack:String?
    
    init(message:String){
        self.message = message
        self.stack = nil
        
    }
    
    init(jsValue:JSValue) {
        if jsValue.isObject == true {
            let dict = jsValue.toObject() as! [String: String]
            if let message = dict["message"] {
                self.message = message
                self.stack = dict["stack"]
            } else {
                var msg = ""
                for (key, val) in dict {
                    msg = msg + key + " : " + val
                }
                self.message = msg
                self.stack = nil
            }
        } else {
            self.message = jsValue.toString()
            self.stack = nil
        }
        
        
        
    }
    
}
