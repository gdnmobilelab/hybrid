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
    fileprivate let _workerURL:String
    
    var workerURL:URL {
        get {
            return URL(string: self._workerURL)!
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
    
    func encode(with aCoder: NSCoder) {
        
        aCoder.encode(self.title, forKey: "title")
        aCoder.encode(self.pushID, forKey: "pushID")
        aCoder.encode(self._workerURL, forKey: "workerURL")
        
        do {
            let toJSON = try JSONSerialization.data(withJSONObject: self.options, options: [])
            aCoder.encode(toJSON, forKey: "options")
        } catch {
            log.error("Could not serialize notification options: " + String(error))
        }
        
    }

    required convenience init(coder decoder: NSCoder) {
        let title = decoder.decodeObject(forKey: "title") as! String
        let pushID = decoder.decodeObject(forKey: "pushID") as! String
        let optionsAsData = decoder.decodeObject(forKey: "options") as! Data
        let workerURL = decoder.decodeObject(forKey: "workerURL") as! String
        
        var options: [String:AnyObject] = [:]
        
        do {
            options = try JSONSerialization.jsonObject(with: optionsAsData, options: []) as! [String:AnyObject]
        } catch {
            log.error("Could not deserialize notification options:" + String(error))
        }

        self.init(title: title, options: options, pushID: pushID, workerURL: workerURL)
    }

}

func ==(lhs: PendingNotificationShow, rhs: PendingNotificationShow) -> Bool {
    return lhs.pushID == rhs.pushID
}
