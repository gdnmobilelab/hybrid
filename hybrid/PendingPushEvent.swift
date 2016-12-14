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
/// app itself. Push events are processed in the background by the app, unless it has been force
/// quit by the user.
@objc class PendingPushEvent : NSObject, NSCoding {
    var serviceWorkerURL: String
    var payload: String
    var dateAdded: NSDate
    var pushID:String
    
    /// Randomly generated UUID to allow us to refer to specific PushEvents when deleting, etc
    var uuid:String
    
    func encodeWithCoder(aCoder: NSCoder) {
        
        aCoder.encodeObject(self.serviceWorkerURL, forKey: "service_worker_url")
        aCoder.encodeObject(self.dateAdded, forKey: "date_added")
        aCoder.encodeObject(self.payload, forKey: "payload")
        aCoder.encodeObject(self.uuid, forKey: "uuid")
        aCoder.encodeObject(pushID, forKey: "pushID")
        
    }
    
    init(serviceWorkerURL:String, payload:String, date:NSDate, pushID:String, uuid: String = NSUUID().UUIDString) {
        self.dateAdded = date
        self.serviceWorkerURL = serviceWorkerURL
        self.payload = payload
        self.uuid = uuid
        self.pushID = pushID
    }
    
    required convenience init(coder decoder: NSCoder) {
        let dateAdded = decoder.decodeObjectForKey("date_added") as! NSDate
        let serviceWorkerURL = decoder.decodeObjectForKey("service_worker_url") as! String
        let payload = decoder.decodeObjectForKey("payload") as! String
        let uuid = decoder.decodeObjectForKey("uuid") as! String
        let pushID = decoder.decodeObjectForKey("pushID") as! String
        
        self.init(serviceWorkerURL: serviceWorkerURL, payload: payload, date: dateAdded, pushID: pushID, uuid: uuid)
    }
    
}
