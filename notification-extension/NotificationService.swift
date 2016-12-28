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
        let dateSent = request.content.userInfo["send_time"] as! String
        let dateSentAsDate = NSDate(timeIntervalSince1970: Double(dateSent)! / 1000)
        
        // Store the push event so that we can refer to it the next time the app or notification content
        // extension is launched. If the app is active in the background it'll pick this up immediately.
        PendingPushEventStore.add(PendingPushEvent(serviceWorkerURL: workerURL, payload: payload, date: dateSentAsDate, pushID: id))
        
        let userInfo = request.content.userInfo
        
        let attachments = userInfo["ios_attachments"] as? String
        let maybeActions = userInfo["ios_actions"] as? String
        let maybeCollapse = userInfo["ios_collapse_id"] as? String
        let maybeSilent = userInfo["ios_silent"] as? String
        
        if maybeSilent == "true" {
            self.bestAttemptContent!.sound = nil
        } else {
            self.bestAttemptContent!.sound = UNNotificationSound.defaultSound()
        }
        
        
        
        if let actions = maybeActions {
            PayloadToNotificationContent.setNotificationCategoryBasedOnActions(actions.componentsSeparatedByString(",,,"))
        }
        
        Promise<Void>()
        .then {
            if let collapse = maybeCollapse {
                
                // Firebase doesn't let us set the collapse ID properly yet, so we have to hack it.
                
                self.bestAttemptContent!.threadIdentifier = collapse
                return PayloadToNotificationContent.clearWithTag(collapse)
                .then { numRemoved -> Void in
                    if numRemoved == 0 {
                        return
                    }
                    
                    // To match the way web notifications work, we want this notification to be silent if it's replacing
                    // an existing one. Unless renotify is specified.
                    
                    let maybeRenotify = userInfo["ios_renotify"] as? String
                    
                    if maybeRenotify != "true" {
                        self.bestAttemptContent!.sound = nil
                    }
                    
                }
            }
            
            return Promise<Void>()
        }
        .then { () -> Void in
            if attachments == nil {
                contentHandler(self.bestAttemptContent!)
                return
            }
            
            let attachmentsSplit = attachments!.componentsSeparatedByString(",,,")
            
            PayloadToNotificationContent.urlsToNotificationAttachments(attachmentsSplit, relativeTo: NSURL(string: workerURL)!)
            .then { attachments -> Void in
                
                attachments.forEach { self.bestAttemptContent!.attachments.append($0) }
                contentHandler(self.bestAttemptContent!)
                    
            }
        }
        
        
        

        
    }

    
    override func serviceExtensionTimeWillExpire() {

        if let contentHandler = contentHandler, let bestAttemptContent = self.bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
        
    }

}
