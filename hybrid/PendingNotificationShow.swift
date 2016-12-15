//
//  PendingNotificationShow.swift
//  hybrid
//
//  Created by alastair.coote on 14/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

struct NotificationShowAction {
    let title:String
    let identifier:String
}

/// We can't always fully process a showNotification() call because the notification
/// might have already shown in response to a remote push. In that case, we store
/// the show call in UserDefaults, then pull it back out again when the user expands
/// the full notification view.

class PendingNotificationShow: NSObject, NSCoding {
    
    let title:String
    let options:[String:AnyObject]
    let pushID:String
    private let _workerURL:String
    
    var workerURL:NSURL {
        get {
            return NSURL(string: self._workerURL)!
        }
    }
    
    func getActions() -> [NotificationShowAction] {
        
        let actions = self.options["actions"] as? [AnyObject]

        if actions == nil {
            return []
        }
        
        return actions!.map { action in
            return NotificationShowAction(title: action["title"] as! String, identifier: action["action"] as! String)
        }
        
    }
    
    init(title:String, options:[String:AnyObject], pushID:String, workerURL:String) {
        self.title = title
        self.options = options
        self.pushID = pushID
        self._workerURL = workerURL
    }
    
    func encodeWithCoder(aCoder: NSCoder) {
        
        aCoder.encodeObject(self.title, forKey: "title")
        aCoder.encodeObject(self.pushID, forKey: "pushID")
        aCoder.encodeObject(self._workerURL, forKey: "workerURL")
        
        do {
            let toJSON = try NSJSONSerialization.dataWithJSONObject(self.options, options: [])
            aCoder.encodeObject(toJSON, forKey: "options")
        } catch {
            log.error("Could not serialize notification options: " + String(error))
        }
        
    }

    required convenience init(coder decoder: NSCoder) {
        let title = decoder.decodeObjectForKey("title") as! String
        let pushID = decoder.decodeObjectForKey("pushID") as! String
        let optionsAsData = decoder.decodeObjectForKey("options") as! NSData
        let workerURL = decoder.decodeObjectForKey("workerURL") as! String
        
        var options: [String:AnyObject] = [:]
        
        do {
            options = try NSJSONSerialization.JSONObjectWithData(optionsAsData, options: []) as! [String:AnyObject]
        } catch {
            log.error("Could not deserialize notification options:" + String(error))
        }
        
        self.init(title: title, options: options, pushID: pushID, workerURL: workerURL)
    }

}

func ==(lhs: PendingNotificationShow, rhs: PendingNotificationShow) -> Bool {
    return lhs.pushID == rhs.pushID
}
