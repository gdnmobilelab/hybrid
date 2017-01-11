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
    
    @objc(set::)
    func set(_ name: String, value:String)
    
    func get(_ name: String) -> String?
    func delete(_ name:String)
    func getAll(_ name:String) -> [String]?
    
    @objc(append::)
    func append(_ name:String, value:String)
    
    func keys() -> [String]
    init()
}


/// Replicating the Fetch APIs Headers object: https://developer.mozilla.org/en-US/docs/Web/API/Headers
@objc open class FetchHeaders : NSObject, FetchHeadersExports {
    
    fileprivate var values = [String: [String]]()
    
    @objc(set::)
    func set(_ name: String, value: String) {
        values[name.lowercased()] = [value]
    }
    
    func delete(_ name:String) {
        values.removeValue(forKey: name.lowercased())
    }
    
    @objc(append::)
    func append(_ name: String, value: String) {
        if var val = values[name.lowercased()] {
            val.append(value)
        } else {
            values[name.lowercased()] = [value]
        }
    }
    
    func keys() -> [String] {
        var arr = [String]()
        for (key, _) in self.values {
            arr.append(key)
        }
        return arr
    }
    
    func get(_ name:String) -> String? {
        return values[name.lowercased()]?.first
    }

    func getAll(_ name:String) -> [String]? {
        return values[name.lowercased()]
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
    static func fromJSON(_ json:String) throws -> FetchHeaders {
        let jsonAsData = json.data(using: String.Encoding.utf8)!
        let headersObj = try JSONSerialization.jsonObject(with: jsonAsData, options: JSONSerialization.ReadingOptions())
        let fh = FetchHeaders()
        
        for (key, values) in headersObj as! [String: [String]] {
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
        
        let jsonData = try JSONSerialization.data(withJSONObject: dict, options: JSONSerialization.WritingOptions())
        
        return String(data: jsonData, encoding: String.Encoding.utf8)!
    }
    
}

/// The part of our FetchBody object that will be available inside a JSContext
@objc protocol FetchBodyExports : JSExport {
    
    func json() -> JSPromise
    func text() -> JSPromise
    func blob() -> JSPromise
    func arrayBuffer() -> JSPromise
    var bodyUsed:Bool {get}
}


/// A class inherited by FetchRequest and FetchResponse, to provide calls to retreive the body of either
@objc class FetchBody: NSObject, FetchBodyExports {
    
    /// Boolean to indicate whether the body of this request/response has already been consumed
    var bodyUsed:Bool = false
    
    var data:Data?
    
    /// Parse the body as JSON
    ///
    /// - Returns: a JS promise that resolves to JSON, or throws if the text can't be parsed
    func json() -> JSPromise {
        
        let promise = JSPromise()
        do {
            let obj = try JSONSerialization.jsonObject(with: self.data!, options: JSONSerialization.ReadingOptions())
            self.bodyUsed = true
            promise.resolve(obj)
        } catch {
            promise.reject(error)
        }
        
        return promise
        
    }
    
    class DataTransformError : Error {}
    
    /// Parse the body as plaintext
    ///
    /// - Returns: a JS promise that resolves to text. Throws if data can't be converted
    func text() -> JSPromise {
        
        let promise = JSPromise()
        
        do {
            let str = String(data: self.data!, encoding: String.Encoding.utf8)
            
            if str == nil {
                throw DataTransformError() as Error
            }
            
            self.bodyUsed = true
            promise.resolve(str!)
        } catch {
            promise.reject(error)
        }
        
        return promise
    
    }
    
    
    /// Do not parse the body, and pass on the raw data.
    ///
    /// - Returns: a JS promise that resolves to the data. Throws if there is no data
    func blob() -> JSPromise {
        let promise = JSPromise()
        
        if self.data == nil {
            promise.reject(DataTransformError())
        } else {
            promise.resolve(self.data!)
        }
        
        return promise
    }
    
    /// Do not parse the body, and pass on as an array buffer.
    ///
    /// - Returns: a JS promise that resolves to the data. Throws if there is no data
    func arrayBuffer() -> JSPromise {
        let promise = JSPromise()
        
        if self.data == nil {
            promise.reject(DataTransformError())
        } else {
            return ArrayBufferJSPromise(data: self.data!)
        }
        return promise
    }

}


/// The part of our FetchRequest object that will be available inside a JSContext
@objc protocol FetchRequestExports : FetchBodyExports, JSExport {
    init(url:String, options: [String:Any]?)
    var referrer:String? {get}
    var url:String {get}
}


/// A port of the Fetch APIs Request object: https://developer.mozilla.org/en-US/docs/Web/API/Request/Request
@objc class FetchRequest : FetchBody, FetchRequestExports {
    
    var url:String
    var method:String
    var headers:FetchHeaders
   
    required init(url:String, options: [String: Any]?)  {
        self.url = url
        
        var data:Data? = nil
        
        if let opts = options {
            if let method = opts["method"] as? String {
                self.method = method
            } else {
                self.method = "GET"
            }
            
            // Headers can be an instance of FetchHeaders or a simple JS object.
            
            if let headers = opts["headers"] as? [String: AnyObject] {
                self.headers = FetchHeaders(dictionary: headers)
            } else if let headers = opts["headers"] as? FetchHeaders {
                self.headers = headers
            } else {
                self.headers = FetchHeaders()
            }
            
            if let body = opts["body"] as? String {
                data = body.data(using: String.Encoding.utf8)
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
    func toNSURLRequest() -> URLRequest {

        let request = NSMutableURLRequest(url: URL(string: self.url)!)
        request.httpMethod = self.method
        
        for key in self.headers.keys() {
            let allValsJoined = self.headers.getAll(key)?.joined(separator: ",")
            request.setValue(allValsJoined, forHTTPHeaderField: key)
        }
        
        if self.data != nil {
            request.httpBody = self.data
        }
        
        
        return request as URLRequest
    }
}

/// The part of our FetchResponse object that will be available inside a JSContext
@objc protocol FetchResponseExports : FetchBodyExports, JSExport {
    init(body:Any?, options: [String:Any]?)
    var status:Int {get set}
    var statusText:String {get set}
}


/// A port of the Fetch API's Response object: https://developer.mozilla.org/en-US/docs/Web/API/Response
@objc class FetchResponse : FetchBody, FetchResponseExports {
    
    let headers:FetchHeaders
    var status:Int
    var statusText:String
    
    init(body: Data?, status: Int, statusText:String, headers: FetchHeaders) {
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
    required init(body: Any?, options: [String:Any]?) {
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
                self.data = bodyText.data(using: String.Encoding.utf8)
            } else if let bodyData = body as? Data {
                self.data = bodyData
            } else {
                log.error("Body provided is not a recognised type.")
            }
            
        }
        
    }
    
}


/// What our GlobalFetch class exports in JSContexts - i.e., just a single fetch function that matches the JS API.
@objc protocol GlobalFetchExports: JSExport {
    @objc(fetch::)
    func fetch(_ url:JSValue, options:JSValue) -> JSPromise
}

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
@objc class GlobalFetch: NSObject, GlobalFetchExports {
    
    let scope:URL
    
    init(workerScope: URL) {
        self.scope = workerScope
    }
    
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
    
    
    /// The function that actually does the remote fetch and returns data
    ///
    /// - Parameters:
    ///   - request: The FetchRequest to process
    ///   - options: The options for this request, as outlined in the 'init' object here: https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch
    /// - Returns: A promise that will resolve with a FetchResponse when the operation succeeds.
    static func fetchRequest(_ request: FetchRequest, options:[String:AnyObject] = [:]) -> Promise<FetchResponse> {
        
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
                    
                    DispatchQueue.main.async {
                        fulfill(resp)
                    }
                    
                    
                    
                    
                } else {
                    reject(NoErrorButNoResponseError())
                }

                
            })
            
            task.resume()
        }.then { response in
            NSLog("ehere")
            return Promise(value: response)
        }
        
    }
    
    
    /// Quick function to allow us to run a GET request directly to a URL
    ///
    /// - Parameter url: The string URL to download
    /// - Returns: a promise that evaluates to a FetchResponse.
    static func fetch(_ url:String) -> Promise<FetchResponse> {
        return fetchRequest(FetchRequest(url: url, options: nil))
    }
    
    @objc(fetch::)
    /// Function call that matches the JavaScript Fetch API, albeit wrapped in callbacks rather than promises.
    ///
    /// - Parameters:
    ///   - requestVal: Either a string or an instance of a FetchRequest class.
    ///   - options: The options for this request, as outlined in the 'init' object here: https://developer.mozilla.org/en-US/docs/Web/API/GlobalFetch/fetch
    /// - Returns: a JS promise that evaluates to a FetchResponse or throws in the case of error
    func fetch(_ requestVal: JSValue, options:JSValue) -> JSPromise {
        
        let request = GlobalFetch.getRequest(requestVal, options: options)
        
        // It's possible to request relative to scope. So we need to make sure we handle that.
        request.url = URL(string: request.url, relativeTo: self.scope)!.absoluteString
        
        return PromiseToJSPromise.pass(GlobalFetch.fetchRequest(request))

    }
    
    
    /// Add Request, Response, Headers and Body to a JSContext's global scope.
    ///
    /// - Parameter context: The JSContext to add to.
    func addToJSContext(_ context:JSContext) {
        context.setObject(FetchRequest.self, forKeyedSubscript: "Request" as (NSCopying & NSObjectProtocol)!)
        context.setObject(FetchResponse.self, forKeyedSubscript: "Response" as (NSCopying & NSObjectProtocol)!)
        context.setObject(FetchHeaders.self, forKeyedSubscript: "Headers" as (NSCopying & NSObjectProtocol)!)
        context.setObject(FetchBody.self, forKeyedSubscript: "Body" as (NSCopying & NSObjectProtocol)!)
        context.setObject(GlobalFetch.self, forKeyedSubscript: "GlobalFetch" as (NSCopying & NSObjectProtocol)!)
        
        let fetchAsConvention: @convention(block) (JSValue, JSValue) -> JSPromise = self.fetch
        
        context.setObject(unsafeBitCast(fetchAsConvention, to: AnyObject.self), forKeyedSubscript: "fetch" as (NSCopying & NSObjectProtocol)!)
        
    }
}
