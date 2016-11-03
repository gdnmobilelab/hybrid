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



class NotificationDelegate : NSObject, UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(center: UNUserNotificationCenter, willPresentNotification notification: UNNotification, withCompletionHandler completionHandler: (UNNotificationPresentationOptions) -> Void) {
        completionHandler(UNNotificationPresentationOptions.Alert)
    }
    
    func userNotificationCenter(center: UNUserNotificationCenter, didReceiveNotificationResponse response: UNNotificationResponse, withCompletionHandler completionHandler: () -> Void) {
        
        
        let pendingActions = PendingWebviewActions.getAll()
        
        pendingActions.forEach { event in
            if event.type == WebviewClientEventType.OpenWindow {
                AppDelegate.rootController?.pushNewHybridWebViewControllerFor(NSURL(string: event.urlToOpen!)!)
            } else {
                HybridWebview.processClientEvent(event)
            }
        }
        
        PendingNotificationActions.reset()
        PendingWebviewActions.clear()
        completionHandler()

       // NotificationDelegate.processAction(response)
        
    }
    

    
}

let NotificationDelegateInstance = NotificationDelegate()
