//
//  NotificationService.swift
//  notification-extension
//
//  Created by alastair.coote on 20/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import UserNotifications
import PromiseKit
import JavaScriptCore


class NotificationService: UNNotificationServiceExtension {

    var bestAttemptContent: UNMutableNotificationContent?
    var contentHandler: ((UNNotificationContent) -> Void)?
   
    override func didReceiveNotificationRequest(request: UNNotificationRequest, withContentHandler contentHandler: (UNNotificationContent) -> Void) {
        
        self.contentHandler = contentHandler
        
        do {
            
            // Outside of app context, so we need to make our DB
            
            try Db.createMainDatabase()
            
            // We pass the content handler over to the service worker, so when it shows
            // a notification it will replace this notification rather than show a new one
            
            ServiceWorkerRegistration.notificationExtensionContentHandler = contentHandler
            
            let hybridData = request.content.userInfo["hybrid_data"]!
            
            let workerURL = hybridData["service_worker_url"] as! String
            let payload = hybridData["payload"] as! String


          
            ServiceWorkerInstance.getActiveWorkerByURL(NSURL(string: workerURL)!)
            .then { sw in
                NSLog("Send push event")
                return sw!.dispatchPushEvent(payload)
            }
            .then { () -> Void in
                NSLog("Doing content handler check")
                if ServiceWorkerRegistration.notificationExtensionContentHandler != nil {
                    // if not nil then we haven't shown a notification in response to the
                    // push event. Which we definitely should. But if not, we'll display
                    // the original content.
                    NSLog("Content handler not yet used")
                    contentHandler(request.content)
                }
                
            }
        
        } catch {
            log.error("Notification extension failed:" + String(error))
        }

    }

   
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
//        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
//            contentHandler(bestAttemptContent)
//        }
        
        NSLog("will expire")
    }

}
