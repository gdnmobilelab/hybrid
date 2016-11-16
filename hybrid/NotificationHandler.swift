//
//  NotificationHandler.swift
//  hybrid
//
//  Created by alastair.coote on 05/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UserNotifications
import JavaScriptCore
import PromiseKit


/// Likely to be deprecated - currently only stores a flag to indicate whether a notification
/// is pending close or not.
class PendingNotificationActions {
    private static let groupDefaults = NSUserDefaults(suiteName: "group.gdnmobilelab.hybrid")!
    
    private static func setValue(name:String, val:AnyObject?) {
        if val == nil {
            groupDefaults.removeObjectForKey(name)
        } else {
            groupDefaults.setObject(val!, forKey: name)
        }
        
    }
    
    private static func getValue(name:String) -> AnyObject? {
        return groupDefaults.objectForKey(name)
    }
    
    static var closeNotification:Bool? {
        get {
            return getValue("pendingNotifications.closeNotification") as? Bool
        }
        
        set(val) {
            setValue("pendingNotifications.closeNotification", val: val)
        }
    }
    
    
    static func reset() {
        self.closeNotification = nil
    }
}


/// Quick struct to store which views are currently active inside out notification-content extension. We need to keep
/// track of these so that the worker can play/pause video and animate the canvas as part of the NotificationEvent
struct ActiveNotificationViews {
    var video:NotificationVideo?
    var canvas:CanvasView?
}


/// Handles the response to a user interacting with a notification. Fires a NotificationEvent inside the worker, which can in turn
/// do things like close the notification, or push another one to replace the current view.
class NotificationHandler {
    
    
    /// This is called by the NotificationViewController when a user interacts with a notification
    ///
    /// - Parameters:
    ///   - response: The response - contains info on whether it was an action tap, a close, or other
    ///   - userInfo: The original userInfo object created when the notification was posted
    ///   - activeViews: To be passed into the worker and allow video/canvas control in response to events
    /// - Returns: A promise that resolves when the event has fired and any waitUntil() calls are complete
    static func processAction(response:UNNotificationResponse, userInfo:[NSObject: AnyObject], activeViews: ActiveNotificationViews) -> Promise<Void> {
       
        let notificationData = userInfo["originalNotificationOptions"]!
        
        let notification = Notification(title: userInfo["originalTitle"] as! String, notificationData: notificationData )

        notification.video = activeViews.video
        
        let workerScope = userInfo["serviceWorkerScope"] as! String
        
        var action = ""
        
        if response.actionIdentifier != UNNotificationDefaultActionIdentifier {
            action = response.actionIdentifier
        }
        
        return ServiceWorkerManager.getServiceWorkerWhoseScopeContainsURL(NSURL(string:workerScope)!)
        .then { sw in
            
            var eventType = "notificationclick"
            
            if response.actionIdentifier == "com.apple.UNNotificationDismissActionIdentifier" {
                eventType = "notificationclose"
            }
            let notificationEvent = NotificationEvent(type: eventType, notification: notification, action: action)
            
            return sw!.dispatchExtendableEvent(notificationEvent)
            .then { _ in
                // disregard result - we don't need it
                return Promise<Void>()
            }
            
        }
        

    
    }
}
