//
//  PromiseToJSPromise.swift
//  hybrid
//
//  Created by alastair.coote on 18/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit


/// This would just be a part of JSPromise, but Objective C doesn't like generics.
/// So instead it's just a small wrapper class that accepts a PromiseKit promise of
/// any type, and converts it into a JSPromise
class PromiseToJSPromise<T> {
    
    static func pass(promise:Promise<Void>) -> JSPromise {
        let jspromise = JSPromise()
        
        promise.then {
            jspromise.resolve(nil)
        }
        .error { err in
            jspromise.reject(err)
        }
        
        return jspromise
    }
    
    static func pass(promise:Promise<Bool>) -> JSPromise {
        let jspromise = JSPromise()
        
        promise.then { result in
            jspromise.resolve(result)
        }
        .error { err in
            jspromise.reject(err)
        }
        
        return jspromise
    }
    
}



extension PromiseToJSPromise where T: AnyObject {
    static func pass(promise:Promise<T>) -> JSPromise {
        let jspromise = JSPromise()
        
        promise
        .then { result in
            jspromise.resolve(result)
        }
        .error { err in
            jspromise.reject(err)
        }
        
        return jspromise
    }
    
    static func pass(promiseArray:Promise<[T]>) -> JSPromise {
        let jspromise = JSPromise()
        
        promiseArray
            .then { result in
                jspromise.resolve(result)
            }
            .error { err in
                jspromise.reject(err)
        }
        
        return jspromise
    }
}

