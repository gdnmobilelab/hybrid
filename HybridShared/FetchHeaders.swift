//
//  FetchHeaders.swift
//  hybrid
//
//  Created by alastair.coote on 06/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
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
    public static func fromJSON(_ json:String) throws -> FetchHeaders {
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
    public func toJSON() throws -> String {
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
