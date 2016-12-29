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

class PromiseAlreadyResolvedError : Error {}

@objc protocol ExtendableEventExports: JSExport {
    var type:String {get}
    init(type:String)
    func waitUntil(_ promise:JSValue)
}

@objc class ExtendableEvent : NSObject, ExtendableEventExports {
    let type: String
    
    var waitUntilPromise:JSValue?
    var hasResolved = false

    required init(type:String) {
        self.type = type
        super.init()
    }
    
    func waitUntil(_ promise:JSValue) {
        
        // JavascriptCore doesn't like functions that throw. Not sure what to do about that.
        
//        if self.hasResolved == true {
//            throw PromiseAlreadyResolvedError()
//        }
        self.waitUntilPromise = promise
    }
    
    func resolve() -> Promise<Void> {
        self.hasResolved = true
        if self.waitUntilPromise == nil {
            return Promise(value: ())
        }
        
        return JSPromiseToPromise<Void>.pass(self.waitUntilPromise!)
        
    }

}
