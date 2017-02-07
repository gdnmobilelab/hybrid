//
//  UserDefaultStore.swift
//  hybrid
//
//  Created by alastair.coote on 14/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
open class UserDefaultStore<T> where T:NSCoding, T:Equatable {
    
    fileprivate var storeKey:String
    fileprivate var classNameAsString:String
    
    public init(storeKey: String, classNameAsString: String) {
        self.storeKey = storeKey
        self.classNameAsString = classNameAsString
        
        NSKeyedArchiver.setClassName(self.classNameAsString, for: T.self)
        NSKeyedUnarchiver.setClass(T.self, forClassName: self.classNameAsString)
        
    }
    
    /// Get an array of objects from UserDefaults
    ///
    /// - Returns: An array of all the stored objects
    open func getAll() -> [T] {
        
        if let storedData = SharedResources.userDefaults.data(forKey: self.storeKey) {
            
            var stored:[T] = []
            
            if storedData.count == 0 {
                return stored
            }
            
            do {
            
                try ObjC.catchException {
                    if let existingStore = NSKeyedUnarchiver.unarchiveObject(with: storedData) as? [T] {
                        stored = existingStore
                    } else {
                        log.error("Serialized object was not in the form expected")
                    }
                }
                
            } catch {
                log.error("Failed to decode user default store: " + String(describing: error))
            }
            
            return stored
        }
        
        return []
    }
    
    /// Overwrite the current array of pending push events with the values provided
    ///
    /// - Parameter events: The new array to store
    fileprivate func set(_ events: [T]) {
        
        let archived = NSKeyedArchiver.archivedData(withRootObject: events)
        SharedResources.userDefaults.set(archived, forKey: self.storeKey)
        
    }
    
    /// Append a new object to the end of the stored array. Uses set(), so if you're
    /// adding many at at time, you're better off using getAll() then set()
    ///
    /// - Parameter pushEvent: The object to add
    public func add(_ newObject:T) {
        
        var all = self.getAll()
        all.append(newObject)
        
        self.set(all)
        
    }
    
    /// Remove a specific push event from the array
    ///
    /// - Parameter pushEvent: The push event to remove
    public func remove(_ objToRemove:T) {
        var all = self.getAll()
        
        let indexOfThisOne = all.index { thisObj in
            return self.equals(objToRemove, rhs: thisObj)
        }
        
        all.remove(at: indexOfThisOne!)
        self.set(all)
    }
    
    /// Remove all pending push events
    public func removeAll() {
        SharedResources.userDefaults.removeObject(forKey: self.storeKey)
    }
    
    open func equals(_ lhs:T, rhs:T) -> Bool {
        return lhs == rhs
    }
    
}
