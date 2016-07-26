//
//  PromisedEvents.swift
//  hybrid
//
//  Created by alastair.coote on 26/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit

class PromisedEvents {
    
    typealias PromiseResolve = (Void, NSError?) -> Void
    
    var eventPromises = [String: [PromiseResolve]]()
    
    func waitFor(name:String) -> Promise<Void> {
        
        let promise = Promise<Void> { (resolve: PromiseResolve) in
            
            if (self.eventPromises[name] == nil) {
                self.eventPromises[name] = [PromiseResolve]()
            }
            
            self.eventPromises[name]?.append(resolve)
        }
        
        return promise
    }
    
    func trigger(name: String) {
        let allResolves = eventPromises[name]!
        for resolve in allResolves {
            resolve((), nil)
        }
        eventPromises.removeValueForKey(name)
    }
    
    func error(name: String, error: ErrorType) {
        let allResolves = eventPromises[name]!
        for resolve in allResolves {
            resolve((), error as NSError)
        }
        eventPromises.removeValueForKey(name)
    }

}