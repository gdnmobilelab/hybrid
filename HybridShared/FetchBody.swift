//
//  FetchBody.swift
//  hybrid
//
//  Created by alastair.coote on 06/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit


/// A class inherited by FetchRequest and FetchResponse, to provide calls to retreive the body of either
@objc public class FetchBody: NSObject {
    
    /// Boolean to indicate whether the body of this request/response has already been consumed
    public var bodyUsed:Bool = false
    
    var data:Data?
    
    func getDataIfExists() throws -> Data {
        
        if self.data == nil {
            throw ErrorMessage("Attempt to use FetchBody data when it doesn't exist")
        }
        
        return self.data!
    }
    
    /// Parse the body as JSON
    ///
    /// - Returns: a JS promise that resolves to JSON, or throws if the text can't be parsed
    public func json() -> Promise<[String: AnyObject]> {
        
        return Promise(value: ())
        .then {
            let obj = try JSONSerialization.jsonObject(with: self.getDataIfExists(), options: JSONSerialization.ReadingOptions()) as? [String: AnyObject]
            
            if obj == nil {
                throw ErrorMessage("JSON parse attempt returned nil")
            }
            
            
            self.bodyUsed = true
            return Promise(value: obj!)
        }
        
    }
    
    /// Parse the body as plaintext
    ///
    /// - Returns: a JS promise that resolves to text. Throws if data can't be converted
    public func text() -> Promise<String> {
        
        return Promise(value: ())
        .then {
            
            let str = try String(data: self.getDataIfExists(), encoding: String.Encoding.utf8)
            
            if str == nil {
                throw ErrorMessage("Attempt to create string from data failed")
            }
            
            self.bodyUsed = true
            return Promise(value: str!)
        }
        
    }
    
    
    /// Do not parse the body, and pass on the raw data.
    ///
    /// - Returns: a JS promise that resolves to the data. Throws if there is no data
    public func blob() -> Promise<Data> {
        
        return Promise(value: ())
        .then {
            
            let data = try self.getDataIfExists()
            
            self.bodyUsed = true
            return Promise(value: data)
        }
    
    }
    
}
