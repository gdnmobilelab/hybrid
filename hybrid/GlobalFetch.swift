//
//  GlobalFetch.swift
//  hybrid
//
//  Created by alastair.coote on 18/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Alamofire
import PromiseKit
import JavaScriptCore

class FetchSetupError : ErrorType {}

@objc protocol FetchHeadersExports : JSExport {
    func set(name: String, value:String)
    func get(name: String) -> String?
    func deleteValue(name:String)
    func getAll(name:String) -> [String]?
    func append(name:String, value:String)
    func keys() -> [String]
    init()
//    init(dictionary: [String: AnyObject])
}

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

@objc protocol FetchBodyExports : JSExport {
    
    // TODO: implement more, like blob()
   
    func json(callback:JSValue, errorCallback: JSValue) -> Void
    func text(callback:JSValue, errorCallback: JSValue) -> Void
    var bodyUsed:Bool {get}
}

@objc public class FetchBody: NSObject, FetchBodyExports {
    var bodyUsed:Bool = false
    var data:NSData?
    
    class FetchNoBodyError : ErrorType {}
    
  
    
    private func wrapInCallbacks(callback:JSValue, errorCallback:JSValue, block: () throws -> AnyObject) {
        do {
            let returnObj = try block()
            callback.callWithArguments([returnObj])
        } catch {
            errorCallback.callWithArguments([String(error)])
        }
    }
    
    
    public func json(callback:JSValue, errorCallback: JSValue) -> Void{
        
        self.wrapInCallbacks(callback, errorCallback: errorCallback) { _ in
            let obj = try NSJSONSerialization.JSONObjectWithData(self.data!, options: NSJSONReadingOptions())
            self.bodyUsed = true
            return obj
        }
        
    }
    
    func text(callback:JSValue, errorCallback: JSValue) {
        
        self.wrapInCallbacks(callback, errorCallback: errorCallback) { _ in
            
            if self.data == nil {
                throw FetchNoBodyError()
            }
            
            let str = String(data: self.data!, encoding: NSUTF8StringEncoding)!
            self.bodyUsed = true
            return str
        }
    
    }
}

@objc protocol FetchRequestExports : FetchBodyExports, JSExport {
    init(url:String, options: [String:AnyObject]?)
    var referrer:String? {get}
    var url:String {get}
}

@objc public class FetchRequest : FetchBody, FetchRequestExports {
    
    var url:String
    var method:String
    var headers:FetchHeaders
    
   
    required public init(url:String, options: [String: AnyObject]?)  {
        self.url = url
        
        if let opts = options {
            self.method = opts["method"] as! String
            
            if let headers = opts["headers"] as? [String: AnyObject] {
                self.headers = FetchHeaders(dictionary: headers)
            } else {
                self.headers = FetchHeaders()
            }
            
            
        } else {
            self.method = "GET"
            self.headers = FetchHeaders()
        }
        
    }
    
    var referrer:String? {
        get {
            return self.headers.get("referrer")
        }
    }
   
    
    func toNSURLRequest() -> NSURLRequest {

        let request = NSMutableURLRequest(URL: NSURL(string: self.url)!)
        request.HTTPMethod = self.method
        
        
        for key in self.headers.keys() {
            let allValsJoined = self.headers.getAll(key)?.joinWithSeparator(",")
            request.setValue(allValsJoined, forHTTPHeaderField: key)
        }
        
        return request
    }
}

@objc protocol FetchResponseExports : FetchBodyExports, JSExport {
    init(body:AnyObject?, options: [String:AnyObject]?)
    
//    func json(callback: JSValue, errorCallback: JSValue)
}

class FetchResponseBodyTypeNotRecognisedError : ErrorType {}

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

@objc protocol GlobalFetchExports: JSExport {
    static func fetch(url:JSValue, options:JSValue, scope:String, callback:JSValue, errorCallback:JSValue) -> Void
}

class NoErrorButNoResponseError : ErrorType {}

@objc class GlobalFetch: NSObject, GlobalFetchExports {
    
    private static func getRequest(request: JSValue, options:JSValue) -> FetchRequest {
        // This parameter can be either a URL string or an instance of a
        // FetchRequest class.
        
        if request.isInstanceOf(FetchRequest) {
            return request.toObjectOfClass(FetchRequest) as! FetchRequest
        }
        
        return FetchRequest(url: request.toString(), options: options.toObject() as? [String : AnyObject])
    }
    
    static func fetchRequest(request: FetchRequest) -> Promise<FetchResponse> {
        log.debug("Fetching " + request.toNSURLRequest().URL!.absoluteString!)
        return Promise<FetchResponse>() {fulfill, reject in
            Alamofire
                .request(request.toNSURLRequest())
                .response(completionHandler: { (req: NSURLRequest?, res: NSHTTPURLResponse?, data: NSData?, err: NSError?) in
                    
                    if err != nil {
                        reject(err!)
                        return
                    }
                    
                    if let response = res {
                        
                        let fh = FetchHeaders(dictionary: response.allHeaderFields as! [String: AnyObject])
                        
                        if fh.get("Content-Encoding") != nil {
                            // it already ungzips stuff automatically, so this just
                            // confuses things. Need to flesh this out more.
                            fh.deleteValue("Content-Encoding")
                        }
                        
                        
                        // TODO: Status text
                        
                        let resp = FetchResponse(body: data, status: response.statusCode, statusText: "", headers: fh)
                        
                        fulfill(resp)
                        
                    } else {
                        reject(NoErrorButNoResponseError())
                    }

                    
            })
        }
    }
    
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
    
    static func addToJSContext(context:JSContext) {
        context.setObject(FetchRequest.self, forKeyedSubscript: "Request")
        context.setObject(FetchResponse.self, forKeyedSubscript: "Response")
        context.setObject(FetchHeaders.self, forKeyedSubscript: "Headers")
        context.setObject(FetchBody.self, forKeyedSubscript: "Body")
        context.setObject(GlobalFetch.self, forKeyedSubscript: "GlobalFetch")
    }
}
