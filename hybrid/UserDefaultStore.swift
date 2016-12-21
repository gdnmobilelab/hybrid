//
//  UserDefaultStore.swift
//  hybrid
//
//  Created by alastair.coote on 14/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


class UserDefaultStore<T where T:NSCoding, T:Equatable> {
    
    private var storeKey:String
    private var classNameAsString:String
    
    init(storeKey: String, classNameAsString: String) {
        self.storeKey = storeKey
        self.classNameAsString = classNameAsString
        
        NSKeyedArchiver.setClassName(self.classNameAsString, forClass: T.self)
        NSKeyedUnarchiver.setClass(T.self, forClassName: self.classNameAsString)
        
    }
    
    /// Get an array of objects from UserDefaults
    ///
    /// - Returns: An array of all the stored objects
    func getAll() -> [T] {
        
        if let storedData = SharedResources.userDefaults.dataForKey(self.storeKey) {
            
            var stored:[T] = []
            
            if storedData.length == 0 {
                return stored
            }
            
            do {
                
//                try ObjC.catchException {
                    if let existingStore = NSKeyedUnarchiver.unarchiveObjectWithData(storedData) as? [T] {
                        stored = existingStore
                    } else {
                        log.error("Serialized object was not in the form expected")
                    }
//                }
                
            } catch {
                log.error("Failed to decode user default store: " + String(error))
            }
            
            return stored
        }
        
        return []
    }
    
    /// Overwrite the current array of pending push events with the values provided
    ///
    /// - Parameter events: The new array to store
    private func set(events: [T]) {
        
        let archived = NSKeyedArchiver.archivedDataWithRootObject(events)
        SharedResources.userDefaults.setObject(archived, forKey: self.storeKey)
        
    }
    
    /// Append a new object to the end of the stored array. Uses set(), so if you're
    /// adding many at at time, you're better off using getAll() then set()
    ///
    /// - Parameter pushEvent: The object to add
    func add(newObject:T) {
        
        var all = self.getAll()
        all.append(newObject)
        
        self.set(all)
        
    }
    
    /// Remove a specific push event from the array
    ///
    /// - Parameter pushEvent: The push event to remove
    func remove(objToRemove:T) {
        var all = self.getAll()
        
        let indexOfThisOne = all.indexOf { thisObj in
            return self.equals(objToRemove, rhs: thisObj)
        }
        
        all.removeAtIndex(indexOfThisOne!)
        self.set(all)
    }
    
    /// Remove all pending push events
    func removeAll() {
        SharedResources.userDefaults.removeObjectForKey(self.storeKey)
    }
    
    func equals(lhs:T, rhs:T) -> Bool {
        return lhs == rhs
    }
    
}