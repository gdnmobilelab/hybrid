//
//  JSONSerializable.swift
//  hybrid
//
//  Created by alastair.coote on 11/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


class JSONSerializable : NSObject {
    
    static func serialize(obj:AnyObject) -> String? {
        do {
            let data = try NSJSONSerialization.dataWithJSONObject(obj, options: [])
            return String(data: data, encoding: NSUTF8StringEncoding)!
        } catch {
            log.error("Could not serialize JSON: " + String(error))
            return nil
        }
    }
    
}
