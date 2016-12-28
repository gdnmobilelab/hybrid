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
    var dateAdded: Date
    var pushID:String
    
    /// Randomly generated UUID to allow us to refer to specific PushEvents when deleting, etc
    var uuid:String
    
    func encode(with aCoder: NSCoder) {
        
        aCoder.encode(self.serviceWorkerURL, forKey: "service_worker_url")
        aCoder.encode(self.dateAdded, forKey: "date_added")
        aCoder.encode(self.payload, forKey: "payload")
        aCoder.encode(self.uuid, forKey: "uuid")
        aCoder.encode(pushID, forKey: "pushID")
        
    }
    
    init(serviceWorkerURL:String, payload:String, date:Date, pushID:String, uuid: String = UUID().uuidString) {
        self.dateAdded = date
        self.serviceWorkerURL = serviceWorkerURL
        self.payload = payload
        self.uuid = uuid
        self.pushID = pushID
    }
    
    required convenience init(coder decoder: NSCoder) {
        let dateAdded = decoder.decodeObject(forKey: "date_added") as! Date
        let serviceWorkerURL = decoder.decodeObject(forKey: "service_worker_url") as! String
        let payload = decoder.decodeObject(forKey: "payload") as! String
        let uuid = decoder.decodeObject(forKey: "uuid") as! String
        let pushID = decoder.decodeObject(forKey: "pushID") as! String
        
        self.init(serviceWorkerURL: serviceWorkerURL, payload: payload, date: dateAdded, pushID: pushID, uuid: uuid)
    }
    
}


