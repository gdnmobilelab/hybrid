//
//  NotificationDelegate.swift
//  hybrid
//
//  Created by alastair.coote on 24/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UserNotifications
import JavaScriptCore
import PromiseKit
import UIKit

class NotificationDelegate : NSObject, UNUserNotificationCenterDelegate {
    
    static var allowedNotificationIDs: [String] = []
    
    func userNotificationCenter(center: UNUserNotificationCenter, willPresentNotification notification: UNNotification, withCompletionHandler completionHandler: (UNNotificationPresentationOptions) -> Void) {
        
        if notification.request.content.userInfo["app_generated_notification"] as? String == "true" {
            completionHandler(UNNotificationPresentationOptions.Alert)
        } else {
            // If it's a remote notification and the app is open, don't show the notification
            log.info("Blocking a remote notification")
            completionHandler(UNNotificationPresentationOptions.Badge)
        }
        
        completionHandler(UNNotificationPresentationOptions.Alert)
    }
    
    
    static func processPendingActions() {
        let pendingActions = PendingWebviewActions.getAll()
        
        pendingActions.forEach { event in
            HybridWebview.processClientEvent(event)
        }
        
        PendingWebviewActions.removeAll()
    }
    
    func userNotificationCenter(center: UNUserNotificationCenter, didReceiveNotificationResponse response: UNNotificationResponse, withCompletionHandler completionHandler: () -> Void) {
        
        let showData = PendingNotificationShowStore.getByPushID(response.notification.request.identifier)

        Promise<Void>()
        .then { () -> Promise<Void> in
            
            if showData == nil {
                throw ErrorMessage(msg: "No pending show data to use in notification event")
            }
            
            let notification = Notification.fromNotificationShow(showData!)
            
            if response.actionIdentifier == UNNotificationDismissActionIdentifier {
                
                if NotificationHandler.IgnoreNotificationCloseInMainApp == true {
                    NotificationHandler.IgnoreNotificationCloseInMainApp = false
                    log.info("Ignoring notification close event as it's already been processed by the notification content extension.")
                    return Promise<Void>()
                }
                
                return NotificationHandler.sendClose(notification)
                .then {
                    // It's possible to call openWindow() in a notificationclose event, but we should
                    // never actually allow that to happen. So just to make sure, we clear any attempts.
                    PendingWebviewActions.removeAll()
                }
            } else if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
                return NotificationHandler.sendClick(notification)
            } else {
                // if it's any other action then the actions are already stored in Pending.
                return Promise<Void>()
            }
        }
        .then { () -> Void in
            
            NotificationDelegate.processPendingActions()
            
            if let showDataExists = showData {
                PendingNotificationShowStore.remove(showDataExists)
            }
            
            completionHandler()
            
        }
        
        
    }
    

    
}

let NotificationDelegateInstance = NotificationDelegate()
