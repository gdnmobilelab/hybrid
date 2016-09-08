//
//  JSCallbackWrapper.swift
//  hybrid
//
//  Created by alastair.coote on 08/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol JSCallbackWrapperExports : JSExport {
    func success(success: JSValue)
    func failure(error:JSValue)
}

@objc class JSCallbackWrapper : NSObject, JSCallbackWrapperExports {
    
    typealias CallbackFunction = (error:JSValue, success: JSValue) -> Void
    
    let callback:CallbackFunction
    
    init(callbackFunc: CallbackFunction) {
        self.callback = callbackFunc
    }
    
    func success(success: JSValue) {
        self.callback(error: JSValue(nullInContext: success.context), success: success)
    }
    
    func failure(error:JSValue) {
        self.callback(error: error, success: JSValue(nullInContext: error.context))
    }
}
