//
//  StoredPushEvent.swift
//  hybrid
//
//  Created by alastair.coote on 20/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

// We can't act on these push payloads immediately because the notification extension doesn't
// have enough memory to launch a service worker. Instead, we store the payload to be accessed
// the next time we fire up a worker, either in the notification content controller, or in the
// app itself.

@objc class StoredPushEvent : NSObject, NSCoding {
    var serviceWorkerScope: String
    var payload: String
    var dateAdded: NSDate
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
}

class PushEventStore {
    static func getAll() -> [StoredPushEvent] {
       
        NSKeyedUnarchiver.setClass(StoredPushEvent.self, forClassName: "StoredPushEvent")
        
         if let storedData = SharedSettings.storage.dataForKey("stored_push_events") {
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
    
    static func getByWorkerScope(workerScope:String) -> [StoredPushEvent] {
        let all = PushEventStore.getAll()
        
        return all.filter({ (pushEvent) -> Bool in
            return pushEvent.serviceWorkerScope == workerScope
        })
    }
    
    static private func set(events: [StoredPushEvent]) {
        NSKeyedArchiver.setClassName("StoredPushEvent", forClass: StoredPushEvent.self)
        SharedSettings.storage.setObject(NSKeyedArchiver.archivedDataWithRootObject(events), forKey: "stored_push_events")
    }
    
    static func add(pushEvent:StoredPushEvent) {
        NSKeyedArchiver.setClassName("StoredPushEvent", forClass: StoredPushEvent.self)
        
        var all = PushEventStore.getAll()
        all.append(pushEvent)
        
        self.set(all)
    }
    
    static func remove(pushEvent:StoredPushEvent) {
        var all = PushEventStore.getAll()
        let indexOfThisOne = all.indexOf { thisEvent in
            return pushEvent.uuid == thisEvent.uuid
        }
        
        all.removeAtIndex(indexOfThisOne!)
        self.set(all)
    }
    
    static func removeAll() {
        SharedSettings.storage.removeObjectForKey("stored_push_events")
    }
 }
