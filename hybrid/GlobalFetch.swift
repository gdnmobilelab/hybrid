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



/// The part of our FetchHeaders object that will be available inside a JSContext
@objc protocol FetchHeadersExports : JSExport {
    func set(name: String, value:String)
    func get(name: String) -> String?
    func deleteValue(name:String)
    func getAll(name:String) -> [String]?
    func append(name:String, value:String)
    func keys() -> [String]
    init()
}


/// Replicating the Fetch APIs Headers object: https://developer.mozilla.org/en-US/docs/Web/API/Headers
@objc public class FetchHeaders : NSObject, FetchHeadersExports {
    
    private var values = [String: [String]]()
    
    func set(name: String, value: String) {
        values[name.lowercaseString] = [value]
    }
    
    func deleteValue(name:String) {
        values.removeValueForKey(name.lowercaseString)
    }
    
    func append(name: String, value: String) {
        if var val = values[name.lowercaseString] {
            val.append(value)
        } else {
            values[name.lowercaseString] = [value]
        }
    }
    
    func keys() -> [String] {
        var arr = [String]()
        for (key, _) in self.values {
            arr.append(key)
        }
        return arr
    }
    
    func get(name:String) -> String? {
        return values[name.lowercaseString]?.first
    }

    func getAll(name:String) -> [String]? {
        return values[name.lowercaseString]
    }
    
    override public required init() {
        super.init()
    }
    
    
    
    /// Parse headers from an existing object. Can accept headers that are either a string or an array of strings
    ///
    /// - Parameter dictionary: Object containing string keys, and either string or array values
    public required init(dictionary: [String: AnyObject]) {
        super.init()
        
        for (key, val) in dictionary {
            
            if let valString = val as? NSString {
                // Values can be strings
                self.set(key, value: valString as String)
                
            } else if let valArray = val as? [NSString] {
                // Or arrays
                for valString in valArray {
                    self.append(key, value: valString as String)
                }
            } else {
                log.error("Invalid value when creating FetchHeaders.")
            }
        }
    }
    
    
    /// Transform a JSON string into a FetchHeaders object. Used when returning responses from the service worker
    /// cache, which stores headers as a JSON string in the database.
    ///
    /// - Parameter json: The JSON string to parse
    /// - Returns: A complete FetchHeaders object with the headers provided in the JSON
    /// - Throws: If the JSON cannot be parsed successfully.
    static func fromJSON(json:String) throws -> FetchHeaders {
        let headersObj = try NSJSONSerialization.JSONObjectWithData(json.dataUsingEncoding(NSUTF8StringEncoding)!, options: NSJSONReadingOptions()) as! [String: [String]]
        
        let fh = FetchHeaders()
        
        for (key, values) in headersObj {
            for value in values {
                fh.append(key, value: value)
            }
        }
        return fh
    }
    
    
    /// Convert a FetchHeaders object to a JSON string, for storage (i.e. in the cache database)
    ///
    /// - Returns: A JSON string
    /// - Throws: if the JSON can't be encoded. Not sure what would ever cause this to happen.
    func toJSON() throws -> String {
        var dict = [String: [String]]()
        
        for key in self.keys() {
            dict[key] = []
            for value in self.getAll(key)! {
                dict[key]!.append(value)
            }
        }
        
        let jsonData = try NSJSONSerialization.dataWithJSONObject(dict, options: NSJSONWritingOptions())
        
        return String(data: jsonData, encoding: NSUTF8StringEncoding)!
    }
    
}

/// The part of our FetchBody object that will be available inside a JSContext
@objc protocol FetchBodyExports : JSExport {
    
    func json(callback:JSValue, errorCallback: JSValue) -> Void
    func text(callback:JSValue, errorCallback: JSValue) -> Void
    func blob(callback:JSValue, errorCallback: JSValue) -> Void
    var bodyUsed:Bool {get}
}


/// A class inherited by FetchRequest and FetchResponse, to provide calls to retreive the body of either
@objc public class FetchBody: NSObject, FetchBodyExports {
    
    /// Boolean to indicate whether the body of this request/response has already been consumed
    var bodyUsed:Bool = false
    
    var data:NSData?
    
    
    /// The API is promise-based, but we can't seamlessly pass promises (yet?) between the two environments
    /// so this function wraps a function in callbacks, which we will transform into promises on the JSContext side
    ///
    /// - Parameters:
    ///   - callback: The JS function to run on success
    ///   - errorCallback: The JS function to run on failure
    ///   - block: The Swift function to try to execute, passing to the above on success or failure
    private func wrapInCallbacks(callback:JSValue, errorCallback:JSValue, block: () throws -> AnyObject) {
        do {
            let returnObj = try block()
            callback.callWithArguments([returnObj])
        } catch {
            errorCallback.callWithArguments([String(error)])
        }
    }
    
    
    /// Parse the body as JSON
    ///
    /// - Parameters:
    ///   - callback: JS function to pass the successfully parsed JSON to
    ///   - errorCallback: JS function to pass an error to if parsing fails
    public func json(callback:JSValue, errorCallback: JSValue) -> Void{
        
        self.wrapInCallbacks(callback, errorCallback: errorCallback) { _ in
            let obj = try NSJSONSerialization.JSONObjectWithData(self.data!, options: NSJSONReadingOptions())
            self.bodyUsed = true
            return obj
        }
        
    }
    
    
    /// Parse the body as plaintext
    ///
    /// - Parameters:
    ///   - callback: JS function to pass the text to
    ///   - errorCallback: JS function to pass an error to in the case of failure
    func text(callback:JSValue, errorCallback: JSValue) {
        
        self.wrapInCallbacks(callback, errorCallback: errorCallback) { _ in
            
            let str = String(data: self.data!, encoding: NSUTF8StringEncoding)!
            self.bodyUsed = true
            return str
        }
    
    }
    
    
    /// Do not parse the body, and pass on the raw data.
    ///
    /// - Parameters:
    ///   - callback: The JS function to send the NSData object to
    ///   - errorCallback: JS function to call when an error occurs (if there is no data)
    func blob(callback: JSValue, errorCallback:JSValue) {
        self.wrapInCallbacks(callback, errorCallback: errorCallback) { _ in
            self.bodyUsed = true
            return self.data!
        }
    }
}


/// The part of our FetchRequest object that will be available inside a JSContext
@objc protocol FetchRequestExports : FetchBodyExports, JSExport {
    init(url:String, options: [String:AnyObject]?)
    var referrer:String? {get}
    var url:String {get}
}


/// A port of the Fetch APIs Request object: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
@objc public class FetchRequest : FetchBody, FetchRequestExports {
    
    var url:String
    var method:String
    var headers:FetchHeaders
   
    required public init(url:String, options: [String: AnyObject]?)  {
        self.url = url
        
        var data:NSData? = nil
        
        if let opts = options {
            self.method = opts["method"] as! String
            
            // Headers can be an instance of FetchHeaders or a simple JS object.
            
            if let headers = opts["headers"] as? [String: AnyObject] {
                self.headers = FetchHeaders(dictionary: headers)
            } else if let headers = opts["headers"] as? FetchHeaders {
                self.headers = headers
            } else {
                self.headers = FetchHeaders()
            }
            
            if let body = opts["body"] as? String {
                data = body.dataUsingEncoding(NSUTF8StringEncoding)
            }
            
            
        } else {
            self.method = "GET"
            self.headers = FetchHeaders()
        }
        
        super.init()
        if data != nil {
            self.data = data!
        }
    }
    
    var referrer:String? {
        get {
            return self.headers.get("referrer")
        }
    }
   
    
    /// Helper function to transform this request internally into an NSURLRequest, to allow
    /// us to actually run the fetch operation
    ///
    /// - Returns: an NSURLRequest object populated with the info contained in this FetchRequest
    func toNSURLRequest() -> NSURLRequest {

        let request = NSMutableURLRequest(URL: NSURL(string: self.url)!)
        request.HTTPMethod = self.method
        
        for key in self.headers.keys() {
            let allValsJoined = self.headers.getAll(key)?.joinWithSeparator(",")
            request.setValue(allValsJoined, forHTTPHeaderField: key)
        }
        
        if self.data != nil {
            request.HTTPBody = self.data
        }
        
        
        return request
    }
}

/// The part of our FetchResponse object that will be available inside a JSContext
@objc protocol FetchResponseExports : FetchBodyExports, JSExport {
    init(body:AnyObject?, options: [String:AnyObject]?)
}


/// A port of the Fetch API's Response object: https://developer.mozilla.org/en-US/docs/Web/API/Response
@objc public class FetchResponse : FetchBody, FetchResponseExports {
    
    let headers:FetchHeaders
    let status:Int
    let statusText:String
    
    init(body: NSData?, status: Int, statusText:String, headers: FetchHeaders) {
        self.status = status
        self.headers = headers
        self.statusText = statusText
        super.init()
        
        self.data = body
    }
    
    
    /// If created without a status, it is assumed the status is 200. This initialiser
    /// matches the JS API
    ///
    /// - Parameters:
    ///   - body: The body for this response
    ///   - options: Options object, containing status, headers, etc
    required public init(body: AnyObject?, options: [String:AnyObject]?) {
        var status = 200
        var statusText = "OK"
        var headers = FetchHeaders()
        
        if let opts = options {
            
            if let statusOpt = opts["status"] as? Int {
                status = statusOpt
            }
            
            if let statusTextOpt = opts["statusText"] as? String {
                statusText = statusTextOpt
            }
            
            if let headersOpt = opts["headers"] as? [String:AnyObject] {
                headers = FetchHeaders(dictionary: headersOpt)
            }
            
        }
        
        self.status = status
        self.statusText = statusText
        self.headers = headers
        
        super.init()
        
        if body != nil {
            
            if let bodyText = body as? String {
                self.data = bodyText.dataUsingEncoding(NSUTF8StringEncoding)
            } else if let bodyData = body as? NSData {
                self.data = bodyData
            } else {
                log.error("Body provided is not a recognised type.")
            }
            
        }
        
    }
    
}


/// What our GlobalFetch class exports in JSContexts - i.e., just a single fetch function that matches the JS API.
@objc protocol GlobalFetchExports: JSExport {
    static func fetch(url:JSValue, options:JSValue, scope:String, callback:JSValue, errorCallback:JSValue) -> Void
}

class NoErrorButNoResponseError : ErrorType {}


/// By default the Fetch API follows redirects: https://fetch.spec.whatwg.org/#concept-request-redirect-mode
/// But if we want to disable this, we need to use this delegate
class DoNotFollowRedirectSessionDelegate : NSObject, NSURLSessionDelegate {
    
    func URLSession(session: NSURLSession, task: NSURLSessionTask, willPerformHTTPRedirection response: NSHTTPURLResponse, newRequest request: NSURLRequest, completionHandler: (NSURLRequest?) -> Void) {
        // Do not follow redirects
        completionHandler(nil)
    }
    
}


/// The container for the Fetch API functions. As well as the one passed to JSContexts, we also have one that can
/// be used in Swift contexts too.
@objc class GlobalFetch: NSObject, GlobalFetchExports {
    
    
    /// When coming from JSContexts, the request parameter can be a FetchRequest or simply a string URL. This
    /// will detect which is being passed, and convert any strings to FetchRequests.
    ///
    /// - Parameters:
    ///   - request: the FetchRequest or string unknown variable
    ///   - options: options passed in with the fetch function call
    /// - Returns: A FetchRequest with all options combined.
    private static func getRequest(request: JSValue, options:JSValue) -> FetchRequest {
        // This parameter can be either a URL string or an instance of a
        // FetchRequest class.
        
        if request.isInstanceOf(FetchRequest) {
            return request.toObjectOfClass(FetchRequest) as! FetchRequest
        }
        
        return FetchRequest(url: request.toString(), options: options.toObject() as? [String : AnyObject])
    }
    
    
    /// The function that actually does the remote fetch and returns data
    ///
    /// - Parameters:
    ///   - request: The FetchRequest to process
    ///   - options: The options for this request, as outlined in the 'init' object here: https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch
    /// - Returns: A promise that will resolve with a FetchResponse when the operation succeeds.
    static func fetchRequest(request: FetchRequest, options:[String:AnyObject] = [:]) -> Promise<FetchResponse> {
        
        let urlRequest = request.toNSURLRequest()
        
        log.debug("Fetching " + urlRequest.URL!.absoluteString!)
        
        return Promise<FetchResponse> { fulfill, reject in
            
            var delegate: NSURLSessionDelegate? = nil
            
            if options["redirect"] != nil && options["redirect"] as? String != "follow" {
                // TODO: work out what "manual" means in the spec
                delegate = DoNotFollowRedirectSessionDelegate()
            }
            

            let session = NSURLSession(configuration: NSURLSessionConfiguration.ephemeralSessionConfiguration(), delegate: delegate, delegateQueue: NSOperationQueue.mainQueue())
            
            let task = session.dataTaskWithRequest(urlRequest, completionHandler: { (data:NSData?, res:NSURLResponse?, err:NSError?) in
                
                if err != nil {
                    reject(err!)
                    return
                }
               
                let httpResponse = res as? NSHTTPURLResponse
                
                
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
    static func fetch(url:String) -> Promise<FetchResponse> {
        return fetchRequest(FetchRequest(url: url, options: nil))
    }
    
    
    /// Function call that matches the JavaScript Fetch API, albeit wrapped in callbacks rather than promises.
    ///
    /// - Parameters:
    ///   - requestVal: Either a string or an instance of a FetchRequest class.
    ///   - options: The options for this request, as outlined in the 'init' object here: https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch
    ///   - scope: The service worker scope this is being run in - to resolve relative URLs
    ///   - callback: JS function to run on successful fetch
    ///   - errorCallback: JS function to run in case of an error
    static func fetch(requestVal: JSValue, options:JSValue, scope:String, callback:JSValue, errorCallback:JSValue) {
        
        let request = self.getRequest(requestVal, options: options)
        
        let scopeURL = NSURL(string:scope)
        
        // It's possible to request relative to scope. So we need to make sure we handle that.
        request.url = NSURL(string: request.url, relativeToURL: scopeURL)!.absoluteString!
        
        self.fetchRequest(request)
        .then { fetchResponse in
            callback.callWithArguments([fetchResponse])
        }
        .error { err in
            errorCallback.callWithArguments([String(err)])
        }

    }
    
    
    /// Add Request, Response, Headers and Body to a JSContext's global scope.
    ///
    /// - Parameter context: The JSContext to add to.
    static func addToJSContext(context:JSContext) {
        context.setObject(FetchRequest.self, forKeyedSubscript: "Request")
        context.setObject(FetchResponse.self, forKeyedSubscript: "Response")
        context.setObject(FetchHeaders.self, forKeyedSubscript: "Headers")
        context.setObject(FetchBody.self, forKeyedSubscript: "Body")
        context.setObject(GlobalFetch.self, forKeyedSubscript: "GlobalFetch")
    }
}
