//
//  ExtendableEvent.swift
//  hybrid
//
//  Created by alastair.coote on 10/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit

@objc protocol ExtendableEventExports: JSExport {
    var type:String {get}
    init(type:String)
    func waitUntil(promise:JSValue)
}

@objc class ExtendableEvent : NSObject, ExtendableEventExports {
    let type: String
    
    var waitUntilPromise:JSValue?

    required init(type:String) {
        self.type = type
        super.init()
    }
    
    func waitUntil(promise:JSValue) {
        self.waitUntilPromise = promise
    }
    
    func resolve() -> Promise<Void> {
        
        if self.waitUntilPromise == nil {
            return Promise<Void>()
        }
        
        return JSPromiseToPromise<Void>.pass(self.waitUntilPromise!)
        
    }

}
