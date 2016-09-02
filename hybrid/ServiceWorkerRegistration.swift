//
//  ServiceWorkerRegistration.swift
//  hybrid
//
//  Created by alastair.coote on 23/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UserNotifications

@objc protocol ServiceWorkerRegistrationExports : JSExport {
    var pushManager:PushManager {get}
    var scope:String {get}
    func showNotification(title:String, options: [String:AnyObject])
}

@objc class ServiceWorkerRegistration: NSObject, ServiceWorkerRegistrationExports {
    var pushManager:PushManager
    var workerURL:NSURL
    var workerScope:NSURL
    
    var scope:String {
        get {
            return self.workerScope.absoluteString!
        }
    }
    
    init(url:NSURL, scope:NSURL) {
        self.pushManager = PushManager()
        self.workerURL = url
        self.workerScope = scope
    }
    
    func showNotification(title:String, options: [String:AnyObject]) {
        let content = UNMutableNotificationContent()
        content.title = title
        
        if let body = options["body"] as? String {
            content.body = body
        }
        
        if let actions = options["actions"] as? [AnyObject] {
            
            // How do we identify categories/tidy up after ourselves?
            var nativeActions = [UNNotificationAction]()
            
            // attempt at deduping. necessary?
            var categoryIdentifier = ""
            
            for action in actions {
                
                let identifier = action["action"] as! String
                let title = action["title"] as! String
                
                let newAction = UNNotificationAction(identifier: identifier, title: title, options: UNNotificationActionOptions())
                nativeActions.append(newAction)
                categoryIdentifier += identifier + "_" + title
            }
            
            let category = UNNotificationCategory(identifier: categoryIdentifier, actions: nativeActions, intentIdentifiers: [], options: UNNotificationCategoryOptions())
            
            UNUserNotificationCenter.currentNotificationCenter().setNotificationCategories([category])
            
            content.categoryIdentifier = categoryIdentifier
        }
        
        if let image = options["image"] as? String {
            do {
                let imageURL = NSURL(string: image, relativeToURL: self.workerScope)!
                
                let attach = try UNNotificationAttachment(identifier: "notify-image", URL: imageURL, options: [:])
                content.attachments.append(attach);
            } catch {
                log.error("Adding image to notification failed:" + String(error))
            }
        }
        
        content.userInfo["originalNotificationOptions"] = options
        content.userInfo["originalTitle"] = title
        content.userInfo["workerURL"] = self.workerURL.absoluteString
        
        let id = String(NSDate().timeIntervalSince1970)
        
        let request = UNNotificationRequest(identifier: id, content: content, trigger: nil)
     
        UNUserNotificationCenter.currentNotificationCenter().addNotificationRequest(request) { (err) in
            NSLog(String(err))
        }
    }
}
