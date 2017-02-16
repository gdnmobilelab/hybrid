//
//  GlobalFetch.swift
//  hybrid
//
//  Created by alastair.coote on 18/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import JavaScriptCore
import HybridShared


extension GlobalFetch {
    
    /// When coming from JSContexts, the request parameter can be a FetchRequest or simply a string URL. This
    /// will detect which is being passed, and convert any strings to FetchRequests.
    ///
    /// - Parameters:
    ///   - request: the FetchRequest or string unknown variable
    ///   - options: options passed in with the fetch function call
    /// - Returns: A FetchRequest with all options combined.
    fileprivate static func getRequest(_ request: JSValue, options:JSValue) -> FetchRequest {
        // This parameter can be either a URL string or an instance of a
        // FetchRequest class.
        
        if request.isInstance(of: FetchRequest.self) {
            return request.toObjectOf(FetchRequest.self) as! FetchRequest
        }
        
        return FetchRequest(url: request.toString(), options: options.toObject() as? [String : AnyObject])
    }
    
    
    /// When we're using fetch inside a worker, we want to be able to use relative URLs. In order to do that,
    /// we create a custom function that specifically binds the URL to our worker scope. This function creates
    /// that, then
    ///
    /// - Parameter scope: The worker scope to bind out function to
    /// - Returns: The fetch() function cast to AnyObject, allowing it to be declared inside the worker scope.
    static func fetchWithScope(scope: URL) -> AnyObject {
        let fetchFunc = { (requestVal: JSValue, options: JSValue) -> JSPromise in
            let request = GlobalFetch.getRequest(requestVal, options: options)
            
            // It's possible to request relative to scope. So we need to make sure we handle that.
            request.url = URL(string: request.url, relativeTo: scope)!.absoluteString
            
            return PromiseToJSPromise.pass(GlobalFetch.fetch(request: request))

        }
        
        let fetchAsConvention: @convention(block) (JSValue, JSValue) -> JSPromise = fetchFunc
        return unsafeBitCast(fetchAsConvention, to: AnyObject.self)
    }

}
