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


class NoErrorButNoResponseError : Error {}


/// By default the Fetch API follows redirects: https://fetch.spec.whatwg.org/#concept-request-redirect-mode
/// But if we want to disable this, we need to use this delegate
class DoNotFollowRedirectSessionDelegate : NSObject, URLSessionDelegate {
    
    func URLSession(_ session: Foundation.URLSession, task: URLSessionTask, willPerformHTTPRedirection response: HTTPURLResponse, newRequest request: URLRequest, completionHandler: (URLRequest?) -> Void) {
        // Do not follow redirects
        completionHandler(nil)
    }
    
}


/// The container for the Fetch API functions. As well as the one passed to JSContexts, we also have one that can
/// be used in Swift contexts too.
public class GlobalFetch {
    
    /// The function that actually does the remote fetch and returns data
    ///
    /// - Parameters:
    ///   - request: The FetchRequest to process
    ///   - options: The options for this request, as outlined in the 'init' object here: https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch
    /// - Returns: A promise that will resolve with a FetchResponse when the operation succeeds.
    public static func fetch(_ request: FetchRequest, options:[String:AnyObject] = [:]) -> Promise<FetchResponse> {
        
        let urlRequest = request.toNSURLRequest()
        
        log.debug("Fetching " + urlRequest.url!.absoluteString)
        
        return Promise<FetchResponse> { fulfill, reject in
            
            var delegate: URLSessionDelegate? = nil
            
            if options["redirect"] != nil && options["redirect"] as? String != "follow" {
                // TODO: work out what "manual" means in the spec
                delegate = DoNotFollowRedirectSessionDelegate()
            }
            
            
            let session = URLSession(configuration: URLSessionConfiguration.ephemeral, delegate: delegate, delegateQueue: OperationQueue.main)
            
            let task = session.dataTask(with: urlRequest, completionHandler: { (data:Data?, res:URLResponse?, err:Error?) in
                
                if err != nil {
                    reject(err!)
                    return
                }
                
                let httpResponse = res as? HTTPURLResponse
                
                
                if let response = httpResponse {
                    
                    let fh = FetchHeaders(dictionary: response.allHeaderFields as! [String: AnyObject])
                    
                    //                    if fh.get("Content-Encoding") != nil {
                    //                        // it already ungzips stuff automatically, so this just
                    //                        // confuses things. Need to flesh this out more.
                    //                        fh.deleteValue("Content-Encoding")
                    //                    }
                    
                    
                    // TODO: Status text
                    
                    let resp = FetchResponse(body: data, status: response.statusCode, statusText: "", headers: fh)
                    
                    fulfill(resp)
                    
                } else {
                    reject(NoErrorButNoResponseError())
                }
                
                
            })
            
            task.resume()
        }
        
    }
    
    
    /// Quick function to allow us to run a GET request directly to a URL
    ///
    /// - Parameter url: The string URL to download
    /// - Returns: a promise that evaluates to a FetchResponse.
    static public func fetch(_ url:String) -> Promise<FetchResponse> {
        return fetch(FetchRequest(url: url, options: nil))
    }
    
}
