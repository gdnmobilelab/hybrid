//
//  JSFetchWrapper.swift
//  ServiceWorker
//
//  Created by alastair.coote on 23/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore
import Shared

//@objc protocol JSFetchExports : JSExport {
//    var headers: FetchHeaders? {get}
//    var ok: Bool {get}
//    var status: Int {get}
//    var statusText:String {get}
//    func text() -> JSValue
//}
//
//@objc class JSFetchResponse : FetchResponse, JSFetchExports {
//    
//    let context:JSContext
//    
//    init(forRequest: FetchRequest, withContext: JSContext) {
//        self.context = withContext
//        super.init(forRequest: forRequest)
//    }
//    
//    static func fetch(fetchVal:JSValue, context: JSContext) -> JSValue {
//        
//        var fetchRequest:FetchRequest? = nil
//        let returnPromise = JSPromise(context: context)
//        
//        if fetchVal.isString {
//            let url = URL(string: fetchVal.toString())
//            if url == nil {
//                returnPromise.reject(ErrorMessage("Could not parse URL"))
//            } else {
//                fetchRequest = FetchRequest(url: URL(string: fetchVal.toString())!)
//            }
//        } else if fetchVal.isInstance(of: FetchRequest.self) {
//            fetchRequest = fetchVal.toObjectOf(FetchRequest.self) as? FetchRequest
//        } else {
//            returnPromise.reject(ErrorMessage("Can only pass string URLs or instances of FetchRequest"))
//        }
//        
//        if fetchRequest == nil {
//            return returnPromise.jsValue
//        }
//        
//        let response = JSFetchResponse(forRequest: fetchRequest!, withContext: context)
//        
//        response.startFetch { err in
//            if err != nil {
//                returnPromise.reject(err!)
//            } else {
//                returnPromise.fulfill(response)
//            }
//        }
//        
//        return returnPromise.jsValue
//        
//    }
//    
//    @objc func text() -> JSValue {
//        
//        let returnPromise = JSPromise(context: self.context)
//        
//        self.text { err, str in
//            if err != nil {
//                returnPromise.reject(err!)
//            } else {
//                returnPromise.fulfill(str!)
//            }
//        }
//        
//        return returnPromise.jsValue
//        
//    }
//    
//    static func applyToContext(context:JSContext) {
//        
//        let fetchFunc: @convention(block) (JSValue) -> JSValue = { (fetchReq:JSValue) in
//           return JSFetchResponse.fetch(fetchVal: fetchReq, context: context)
//        }
//        
//        context.setObject(unsafeBitCast(fetchFunc, to: AnyObject.self), forSubscriptString: "fetch")
//        
//    }
//    
//}

