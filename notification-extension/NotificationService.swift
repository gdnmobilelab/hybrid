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
        
        let workerURL = request.content.userInfo["service_worker_url"] as! String
        let payload = request.content.userInfo["payload"] as! String
        
        self.tryToParseOutNotificationShow(payload, workerURL: workerURL)
        .then { payloadNotification -> Void in
            if payloadNotification != nil {
                contentHandler(payloadNotification!)
            } else {
                contentHandler(request.content)
            }
            
            
        }
        .recover { err in
            NSLog("Failed to parse payload notification: " + String(err))
        }
        
        
        
        // try to intercept a command-formatted notification

        
    }
    
    func tryToParseOutNotificationShow(payloadString:String, workerURL:String) -> Promise<UNNotificationContent?> {
        
        // This is kind of a cheat, but our notification-commands library contains code to show a web notification based on
        // the JSON payload passed through. We can't run the service worker inside the notification extension as it
        // immediately hits the memory limit, so instead we try to parse out a notification show command in the JSON.
        
        // None of this adheres to any kind of service worker standard, though.
        
        return Promise<Void>()
        .then { () -> Promise<UNNotificationContent?> in
            let payloadJSON = try NSJSONSerialization.JSONObjectWithData(payloadString.dataUsingEncoding(NSUTF8StringEncoding)!, options: [])
            let payloadAsArray = payloadJSON as? [AnyObject]
            
            if payloadAsArray == nil {
                // if the payload isn't an array then we know it isn't a notification-commands command set
                return Promise<UNNotificationContent?>(nil)
            }
            
            let firstShowNotificationCommand = payloadAsArray!.filter { obj in
                return obj["command"] as? String == "notification.show"
                }.first
            
            if firstShowNotificationCommand == nil {
                // if there are no notification show commands then there's nothing we can do.
                return Promise<UNNotificationContent?>(nil)
            }
            
            let notificationCommandPayload = firstShowNotificationCommand!["options"]!!
            let notificationOptions = notificationCommandPayload["options"]!!
            
            let title = notificationCommandPayload["title"] as! String
            
            return PayloadToNotificationContent.Convert(title, options: notificationOptions, serviceWorkerScope: workerURL)
            .then { content in
                return Promise<UNNotificationContent?>(content)
            }
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
