//
//  GlobalFetch.swift
//  hybrid
//
//  Created by alastair.coote on 18/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Alamofire

class FetchSetupError : ErrorType {}

@objc protocol FetchHeadersExports {
    func set(name: String, value:String)
    func get(name: String) -> String?
    func getAll(name:String) -> [String]?
    func append(name:String, value:String)
    func keys() -> [String]
    init()
    init(dictionary: [String: AnyObject])
}

@objc class FetchHeaders : NSObject, FetchHeadersExports {
    
    private var values = [String: [String]]()
    
    func set(name: String, value: String) {
        values[name.lowercaseString] = [value]
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
    
    override required init() {
        super.init()
    }
    
    
    required init(dictionary: [String: AnyObject]) {
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
}

@objc public class FetchRequest : FetchBody, FetchRequestExports {
    
    let url:String
    let method:String
    let headers:FetchHeaders
    
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
   
    
    func toNSURLRequest() -> NSURLRequest {
       
        let request = NSMutableURLRequest()
        request.URL = NSURL(string: self.url)!
        request.HTTPMethod = self.method
        
        for key in self.headers.keys() {
            let allValsJoined = self.headers.getAll(key)?.joinWithSeparator(",")
            request.setValue(allValsJoined, forHTTPHeaderField: key)
        }
        
        return request
    }
}

@objc protocol FetchResponseExports : FetchBodyExports, JSExport {
    init(body:String?, options: [String:AnyObject]?)
    
//    func json(callback: JSValue, errorCallback: JSValue)
}

@objc public class FetchResponse : FetchBody, FetchResponseExports {
    
    let headers:FetchHeaders
    let status:Int
    let statusText:String
    
    var testValue: String = "HELLO"
    
    required public init(body: String?, options: [String:AnyObject]?) {
        
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
            self.data = body!.dataUsingEncoding(NSUTF8StringEncoding)
        }
        
    }
  
}

@objc protocol GlobalFetchExports: JSExport {
    static func fetch(url:JSValue, options:JSValue, callback:JSValue, errorCallback:JSValue) -> Void
}

@objc class GlobalFetch: NSObject, GlobalFetchExports {
    
    private static func getRequest(request: JSValue, options:JSValue) -> FetchRequest {
        // This parameter can be either a URL string or an instance of a
        // FetchRequest class.
        
        if request.isInstanceOf(FetchRequest) {
            return request.toObjectOfClass(FetchRequest) as! FetchRequest
        }
        
        return FetchRequest(url: request.toString(), options: options.toObject() as? [String : AnyObject])
    }
    
    static func fetch(requestVal: JSValue, options:JSValue, callback:JSValue, errorCallback:JSValue) {
        
        let request = self.getRequest(requestVal, options: options)
        
        
        
        
        Alamofire
            .request(request.toNSURLRequest())
            .response(completionHandler: { (req: NSURLRequest?, res: NSHTTPURLResponse?, data: NSData?, err: NSError?) in
        
                if err != nil {
                    errorCallback.callWithArguments([String(err)])
                    return
                }
                
                if let response = res {
                    let headersAsString = response.allHeaderFields as! [String: AnyObject]
                    
                    let resp = FetchResponse(body: nil, options: [
                        "status": response.statusCode,
                        "headers": headersAsString
                    ])
                    
                    resp.data = data
                    
                    callback.callWithArguments([resp])
                    
                } else {
                    errorCallback.callWithArguments(["No error, but no response?"])
                }
                
               
            
            })

        
        
    }
    
    static func addToJSContext(context:JSContext) {
        context.setObject(FetchRequest.self, forKeyedSubscript: "Request")
        context.setObject(FetchResponse.self, forKeyedSubscript: "Response")
        context.setObject(FetchHeaders.self, forKeyedSubscript: "Headers")
        context.setObject(FetchBody.self, forKeyedSubscript: "Body")
        context.setObject(GlobalFetch.self, forKeyedSubscript: "GlobalFetch")
    }
}