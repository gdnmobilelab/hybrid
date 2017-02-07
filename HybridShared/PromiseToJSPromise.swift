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
public class PromiseToJSPromise<T> {
    
    public static func pass(_ promise:Promise<T>) -> JSPromise {
        let jspromise = JSPromise()
        
        promise
            .then { result in
                jspromise.resolve(result)
            }
            .catch { err in
                jspromise.reject(err)
        }
        
        return jspromise
    }
    
    public static func pass(_ promiseArray:Promise<[T]>) -> JSPromise {
        let jspromise = JSPromise()
        
        promiseArray
            .then { result in
                jspromise.resolve(result)
            }
            .catch { err in
                jspromise.reject(err)
        }
        
        return jspromise
    }
    
    
}



//extension PromiseToJSPromisehybrid Group where T: AnyObject {
//    static func pass(_ promise:Promise<T>) -> JSPromise {
//        let jspromise = JSPromise()
//
//        promise
//        .then { result in
//            jspromise.resolve(result)
//        }
//        .catch { err in
//            jspromise.reject(err)
//        }
//
//        return jspromise
//    }
//
//    static func pass(_ promiseArray:Promise<[T]>) -> JSPromise {
//        let jspromise = JSPromise()
//
//        promiseArray
//        .then { result in
//            jspromise.resolve(result)
//        }
//        .catch { err in
//            jspromise.reject(err)
//        }
//
//        return jspromise
//    }
//}

