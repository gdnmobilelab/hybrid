//
//  ReturnSerializer.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

class ReturnSerializer {
    
    static func serializeToJSON(_ value: Any?, manager: HybridMessageManager) throws -> String {
        
        if value == nil {
            return "null"
        }
        
        let serialized = try self.serialize(value!, manager: manager)
        
        let data = try JSONSerialization.data(withJSONObject: serialized, options: [])
        
        return String(data: data, encoding: String.Encoding.utf8)!
        
    }
    
    /// If we want to return objects to the webview, they need to be arrays, objects, or other JSON-serializable
    /// primitives. The one exception is objects that adhere to the HybridMessageReceiver protocol, which we need to
    /// map into custom instructions for the webview.
    ///
    /// - Parameter obj: the value we want to convert.
    static func serialize(_ value: Any?, manager: HybridMessageManager) throws -> [String: Any] {
        
        var serializedValue:Any? = nil
        dump(value)
        
        if value == nil || value is Void {
            
            serializedValue = NSNull()
            
        }
        else if let valueIsReceiver = value as? HybridMessageReceiver {
            
            var serializedObject: [String:Any] = [
                "type": "connected-item",
                "jsClassName": type(of: valueIsReceiver).jsClassName
            ]
          
            let existingIndex = manager.getIndexForExistingConnectedItem(valueIsReceiver)
            
            if let index = existingIndex {
                
                serializedObject["existing"] = true
                serializedObject["index"] = index
                
            } else {
                
                let newIndex = manager.addNewConnectedItem(valueIsReceiver)
                
                serializedObject["existing"] = false
                serializedObject["index"] = newIndex
                serializedObject["initialData"] = try self.serialize(valueIsReceiver.getArgumentsForJSMirror(), manager: manager)
                
            }
            
            return serializedObject
            

        } else if value is String || value is Int || value is Double || value is Float || value is Bool {
            
            serializedValue = value
            
        } else if let valueIsArray = value as? [Any?] {
            
            serializedValue = try valueIsArray.map { try self.serialize($0, manager: manager) }

        } else if let valueIsDictionary = value as? [String: Any?] {
            
            var newDictionary = [String: Any]()
            
            try valueIsDictionary.forEach { key, value in
                newDictionary[key] = try self.serialize(value, manager: manager)
            }
            
            serializedValue = newDictionary
            
        }
        
        if serializedValue == nil {
            let failed = String(describing: value!)

            throw ErrorMessage("Encounted an item that was not serializable:" + String(describing: value))
        }
        
        return [
            "type": "value",
            "value": serializedValue!
        ]
        
    }

}
