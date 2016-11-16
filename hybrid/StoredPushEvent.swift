//
//  StoredPushEvent.swift
//  hybrid
//
//  Created by alastair.coote on 20/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

/// We can't act on these push payloads immediately because the notification extension doesn't
/// have enough memory to launch a service worker. Instead, we store the payload to be accessed
/// the next time we fire up a worker, either in the notification content controller, or in the
/// app itself.
@objc class StoredPushEvent : NSObject, NSCoding {
    var serviceWorkerScope: String
    var payload: String
    var dateAdded: NSDate
    
    /// Randomly generated UUID to allow us to refer to specific PushEvents when deleting, etc
    var uuid:String
    
    func encodeWithCoder(aCoder: NSCoder) {
        
        aCoder.encodeObject(self.serviceWorkerScope, forKey: "service_worker_scope")
        aCoder.encodeObject(self.dateAdded, forKey: "date_added")
        aCoder.encodeObject(self.payload, forKey: "payload")
        aCoder.encodeObject(self.uuid, forKey: "uuid")
    }
    
    init(serviceWorkerScope:String, payload:String, date:NSDate, uuid: String = NSUUID().UUIDString) {
        self.dateAdded = date
        self.serviceWorkerScope = serviceWorkerScope
        self.payload = payload
        self.uuid = uuid
    }
    
    required convenience init(coder decoder: NSCoder) {
        let dateAdded = decoder.decodeObjectForKey("date_added") as! NSDate
        let serviceWorkerScope = decoder.decodeObjectForKey("service_worker_scope") as! String
        let payload = decoder.decodeObjectForKey("payload") as! String
        let uuid = decoder.decodeObjectForKey("uuid") as! String
        
        self.init(serviceWorkerScope: serviceWorkerScope, payload: payload, date: dateAdded, uuid: uuid)
    }
    
    override func isEqual(object: AnyObject?) -> Bool {
        if let objAsPush = object as? StoredPushEvent {
            return objAsPush.uuid == object?.uuid
        } else {
            return false
        }
    }
}


/// The UserDefaults-based store where we put PushEvents received by our notification extension, to be
/// retreived later by either the content extension or the app
class PushEventStore {
    
    
    /// Get an array of pending push events from UserDefaults
    ///
    /// - Returns: An array of all the pending push events
    static func getAll() -> [StoredPushEvent] {
       
        NSKeyedUnarchiver.setClass(StoredPushEvent.self, forClassName: "StoredPushEvent")
        
         if let storedData = SharedResources.userDefaults.dataForKey("stored_push_events") {
            var stored = NSKeyedUnarchiver.unarchiveObjectWithData(storedData) as? [StoredPushEvent]
            
            if stored == nil {
                log.error("Somehow stored object is not in the form we want?")
                return []
            }
            
            stored! = stored!.sort({ (el1, el2) -> Bool in
                return el1.dateAdded.compare(el2.dateAdded) == NSComparisonResult.OrderedAscending
            })
            
            return stored!
        }
        
        return []
        
       
    }
    
    /// Utility function that takes the result of getAll() and filters by scope.
    ///
    /// - Parameter workerScope: The service worker scope URL you want to match for
    /// - Returns: An array of push events for that scope
    static func getByWorkerScope(workerScope:String) -> [StoredPushEvent] {
        let all = PushEventStore.getAll()
        
        return all.filter({ (pushEvent) -> Bool in
            return pushEvent.serviceWorkerScope == workerScope
        })
    }
    
    /// Overwrite the current array of pending push events with the values provided
    ///
    /// - Parameter events: The new array to store
    static private func set(events: [StoredPushEvent]) {
        NSKeyedArchiver.setClassName("StoredPushEvent", forClass: StoredPushEvent.self)
        SharedResources.userDefaults.setObject(NSKeyedArchiver.archivedDataWithRootObject(events), forKey: "stored_push_events")
    }
    
    
    /// Append a new push event to the end of the stored array. Uses set(), so if you're
    /// adding many at at time, you're better off using getAll() then set()
    ///
    /// - Parameter pushEvent: The push event to add
    static func add(pushEvent:StoredPushEvent) {
        NSKeyedArchiver.setClassName("StoredPushEvent", forClass: StoredPushEvent.self)
        
        var all = PushEventStore.getAll()
        all.append(pushEvent)
        
        self.set(all)
    }
    
    
    /// Remove a specific push event from the array
    ///
    /// - Parameter pushEvent: The push event to remove
    static func remove(pushEvent:StoredPushEvent) {
        var all = PushEventStore.getAll()
        let indexOfThisOne = all.indexOf { thisEvent in
            
            // TODO: rely on the new equality operator I've added. But need to test it.
            
            return pushEvent.uuid == thisEvent.uuid
        }
        
        all.removeAtIndex(indexOfThisOne!)
        self.set(all)
    }
    
    
    /// Remove all pending push events
    static func removeAll() {
        SharedResources.userDefaults.removeObjectForKey("stored_push_events")
    }
 }
