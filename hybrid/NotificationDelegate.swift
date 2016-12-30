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
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        
        // Not sure about the background state thing here. But something seems to be holding notifications back from displaying
        // when the app is in background mode, I'm just not sure what. Annoyingly, it doesn't seem to happen when I'm testing
        // locally.
        
        if /*UIApplication.sharedApplication().applicationState == UIApplicationState.Background ||*/ notification.request.content.userInfo["app_generated_notification"] as? String == "true" {
            log.info("Showing notification")
            completionHandler(UNNotificationPresentationOptions.alert)
        } else {
            // If it's a remote notification and the app is open, don't show the notification
            
            // Wanted to put this after the promise, so we can catch when the notification show failed
            // but if appears to ignore any completion handler that is run async.
            completionHandler(UNNotificationPresentationOptions.badge)
            
            
            // I thought pending pushes would always be handled in the app delegate. But it appears that is not the case,
            // so we check here too.
            ServiceWorkerManager.processAllPendingPushEvents()
            .then { () -> Void in
                log.info("Blocking a remote notification")
            }
            .catch { err in
                log.error("Error in processing push events: " + String(describing: err))
            }
            
            
        }
    }
    
    
    static func processPendingActions() {
        let pendingActions = PendingWebviewActions.getAll()
        
        pendingActions.forEach { event in
            HybridWebview.processClientEvent(event)
        }
        
        PendingWebviewActions.removeAll()
    }
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        
        let showData = PendingNotificationShowStore.getByPushID(response.notification.request.identifier)

        Promise(value: ())
        .then { () -> Promise<Void> in
            
            if showData == nil {
                throw ErrorMessage("No pending show data to use in notification event")
            }
            
            let notification = Notification.fromNotificationShow(showData!)
            
            if response.actionIdentifier == UNNotificationDismissActionIdentifier {
                
                if NotificationHandler.IgnoreNotificationCloseInMainApp == true {
                    NotificationHandler.IgnoreNotificationCloseInMainApp = false
                    log.info("Ignoring notification close event as it's already been processed by the notification content extension.")
                    return Promise(value: ())
                }
                
                return NotificationHandler.sendNotificationEvent(type:"notificationclose", notification)
                .then {
                    // It's possible to call openWindow() in a notificationclose event, but we should
                    // never actually allow that to happen. So just to make sure, we clear any attempts.
                    PendingWebviewActions.removeAll()
                }
            } else if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
                return NotificationHandler.sendNotificationEvent(type:"notificationclick", notification)
            } else {
                // if it's any other action then the actions are already stored in Pending.
                return Promise(value: ())
            }
        }
        .then { () -> Void in
            
            NotificationDelegate.processPendingActions()
            
            if let showDataExists = showData {
                PendingNotificationShowStore.remove(showDataExists)
            }
            
            completionHandler()
            
        }
        .catch { err in
            log.error("Failed to process received notification response: " + String(describing: err))
        }
        
    }
    

    
}

let NotificationDelegateInstance = NotificationDelegate()
