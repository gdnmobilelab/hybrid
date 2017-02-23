//
//  Deserializer.swift
//  hybrid
//
//  Created by alastair.coote on 21/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

fileprivate let ConnectedItemTypes: [HybridMessageReceiver.Type] = [
    ServiceWorkerContainer.self,
    ConsoleInterceptor.self
]

class Deserializer {
    
    let manager:HybridMessageManager
    
    init(_ manager: HybridMessageManager) {
        self.manager = manager
    }
    
    func deserializeConnectedItem(_ value: [String: Any]) throws -> HybridMessageReceiver {
        
        let existing = value["existing"] as! Bool
        
        if existing == true {
            
            let existingIndex = value["index"] as! Int
            
            return self.manager.connectedItems[existingIndex]!
            
        } else {
            
            let jsClassName = value["jsClassName"] as! String
            let args = value["initialData"] as! [Any]
            
            let typeofNewInstance = ConnectedItemTypes.filter { $0.jsClassName == jsClassName }.first!
            
            let newInstance = try typeofNewInstance.createFromJSArguments(args: args, from: self.manager)
            
            _ = self.manager.addNewConnectedItem(newInstance)
            
            return newInstance
            
        }
    }
    
    func deserialize(_ value: [String: Any?]?) throws -> Any? {
        
        if value == nil {
            return nil
        }
        
        let objectType = value!["type"] as! String
        
        if objectType == "connected-item" {
            
            return try self.deserializeConnectedItem(value!)
            
        } else if objectType == "value" {
            
            let actualValue = value!["value"]! as Any
            
            if let actualArray = actualValue as? [[String:Any?]?] {
                
                return try actualArray.map { try self.deserialize($0) }
                
            }
            else if let actualDictionary = actualValue as? [String: [String:Any?]?] {
                
                var newDictionary = [String: Any?]()
                
                try actualDictionary.forEach { key, value in
                    newDictionary[key] = try self.deserialize(value)
                }
                
                return newDictionary
                
            }
            else if actualValue is String || actualValue is Int || actualValue is Double || actualValue is Float || actualValue is Bool {
                
                return actualValue
                
            } else {
                throw ErrorMessage("Could not deserialize value: " + String(describing: dump(value)))
            }
            
        } else {
            throw ErrorMessage("Did not understand how to deserialize type: " + objectType)
        }
    }
    
}
