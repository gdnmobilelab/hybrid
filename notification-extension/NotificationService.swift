//
//  NotificationService.swift
//  notification-extension
//
//  Created by alastair.coote on 20/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import UserNotifications
import PromiseKit

class NotificationService: UNNotificationServiceExtension {

    var bestAttemptContent: UNMutableNotificationContent?
    
    override func didReceiveNotificationRequest(request: UNNotificationRequest, withContentHandler contentHandler: (UNNotificationContent) -> Void) {
       
        // We pass the content handler over to the service worker, so when it shows
        // a notification it will replace this notification rather than show a new one
        
        ServiceWorkerRegistration.notificationExtensionContentHandler = contentHandler
        
        let hybridData = request.content.userInfo["hybrid_data"]!
        
        let workerURL = hybridData["service_worker_url"] as! String
        let payload = hybridData["payload"] as! String
        
        ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: workerURL)!)
        .then { sw -> Promise<Void> in
            return sw!.dispatchPushEvent(payload)
        }
        .then {
            contentHandler(request.content)
        }
        
        
    }

   
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
//        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
//            contentHandler(bestAttemptContent)
//        }
    }

}
