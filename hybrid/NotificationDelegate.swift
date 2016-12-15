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
            completionHandler(UNNotificationPresentationOptions.Badge)
        }
        
        completionHandler(UNNotificationPresentationOptions.Alert)
    }
    
    
    static func processPendingActions() {
        let pendingActions = PendingWebviewActions.getAll()
        
        pendingActions.forEach { event in
            HybridWebview.processClientEvent(event)
        }
        
        PendingNotificationActions.reset()
        PendingWebviewActions.clear()
    }
    
    func userNotificationCenter(center: UNUserNotificationCenter, didReceiveNotificationResponse response: UNNotificationResponse, withCompletionHandler completionHandler: () -> Void) {
        
        let showData = PendingNotificationShowStore.getByPushID(response.notification.request.identifier)
        
        Promise<Void>()
        .then { () -> Promise<Void> in
            
            if showData == nil {
                throw ErrorMessage(msg: "No pending show data to use in notification event")
            }
            
            if response.actionIdentifier == UNNotificationDismissActionIdentifier {
                return NotificationHandler.sendClose(showData!)
                .then {
                    // It's possible to call openWindow() in a notificationclose event, but we should
                    // never actually allow that to happen. So just to make sure, we clear any attempts.
                    PendingWebviewActions.clear()
                }
            } else if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
                return NotificationHandler.sendClick(showData!)
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
