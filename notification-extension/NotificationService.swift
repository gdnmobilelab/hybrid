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
        self.bestAttemptContent = request.content.mutableCopy() as? UNMutableNotificationContent

        self.bestAttemptContent!.categoryIdentifier = "extended-content"
                
        let id = request.identifier
        let workerURL = request.content.userInfo["service_worker_url"] as! String
        let payload = request.content.userInfo["payload"] as! String
        let dateSent = request.content.userInfo["send_time"] as! Double
        let dateSentAsDate = NSDate(timeIntervalSince1970: dateSent / 1000)
        
        // Store the push event so that we can refer to it the next time the app or notification content
        // extension is launched. If the app is active in the background it'll pick this up immediately.
        PendingPushEventStore.add(PendingPushEvent(serviceWorkerURL: workerURL, payload: payload, date: dateSentAsDate, pushID: id))

        contentHandler(self.bestAttemptContent!)
    }

    
    override func serviceExtensionTimeWillExpire() {

        if let contentHandler = contentHandler, let bestAttemptContent = self.bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
        
    }

}
