//
//  StoredPushEvent.swift
//  hybrid
//
//  Created by alastair.coote on 20/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class StoredPushEvent : NSObject, NSCoding {
    var serviceWorkerUrl: NSURL
    var payload: AnyObject
    var dateAdded: NSDate
    
    func encodeWithCoder(aCoder: NSCoder) {
        
        aCoder.encodeObject(self.serviceWorkerUrl, forKey: "service_worker_url")
        aCoder.encodeObject(self.dateAdded, forKey: "date_added")
        
        do {
            let payloadData = try NSJSONSerialization.dataWithJSONObject(self.payload, options: [])
            aCoder.encodeObject(payloadData, forKey: "payload_data")
        } catch {
            log.error("Failed to serialize payload data.")
        }
        
    }
    
    init(serviceWorkerUrl:NSURL, payload:AnyObject, date:NSDate) {
        self.dateAdded = date
        self.serviceWorkerUrl = serviceWorkerUrl
        self.payload = payload
    }
    
    required convenience init(coder decoder: NSCoder) {
        let dateAdded = decoder.decodeObjectForKey("date_added") as! NSDate
        let serviceWorkerURL = decoder.decodeObjectForKey("service_worker_url") as! NSURL
        let payloadData = decoder.decodeObjectForKey("payload_data") as! NSData
        
        var payload:NSData? = nil
        
        do {
            payload = try NSJSONSerialization.JSONObjectWithData(payloadData, options: []) as? NSData
        } catch {
            log.error("Failed to deserialize payload")
        }
        
        self.init(serviceWorkerUrl: serviceWorkerURL, payload: payload!, date: dateAdded)
    }
}

class PushEventStore {
    static func getAll() -> [StoredPushEvent] {
        var stored = SharedSettings.storage.objectForKey("stored_push_events") as? [StoredPushEvent]
        

        if stored == nil {
            return []
        } else {
            stored = stored!.sort({ (el1, el2) -> Bool in
                return el1.dateAdded.compare(el2.dateAdded) == NSComparisonResult.OrderedAscending
            })
            return stored!
        }
    }
    
    static func getByWorkerURL(workerURL:NSURL) -> [StoredPushEvent] {
        let all = PushEventStore.getAll()
        
        return all.filter({ (pushEvent) -> Bool in
            return pushEvent.serviceWorkerUrl == workerURL
        })
    }
    
    static func add(pushEvent:StoredPushEvent) {
        var all = PushEventStore.getAll()
        all.append(pushEvent)
        SharedSettings.storage.setObject(all, forKey: "stored_push_events")
    }
 }
