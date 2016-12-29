//
//  JSONSerializable.swift
//  hybrid
//
//  Created by alastair.coote on 11/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

/// A tiny helper class to serialize JSON. Was originally going to be a lot more than
/// just this, so can probably be refactored away at some point.
class JSONSerializable : NSObject {
    
    static func serialize(_ obj:Any) -> String? {
        do {
            let data = try JSONSerialization.data(withJSONObject: obj, options: [])
            return String(data: data, encoding: String.Encoding.utf8)!
        } catch {
            log.error("Could not serialize JSON: " + String(describing: error))
            return nil
        }
    }
    
}
