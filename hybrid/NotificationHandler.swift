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



/// Handles the response to a user interacting with a notification. Fires a NotificationEvent inside the worker, which can in turn
/// do things like close the notification, or push another one to replace the current view.
class NotificationHandler {
    
    /// This isn't a standard event, but we can use it for analytics tracking
    ///
    /// - Parameter notificationShow: the cached notification show call
    /// - Returns: A promise that resolves when the event is complete
    static func sendExpand(_ notification: Notification) -> Promise<Void> {
        return ServiceWorkerInstance.getActiveWorkerByURL(notification.belongsToWorkerURL)
        .then { sw in
            
            let event = NotificationEvent(type: "notificationexpand", notification: notification)
            
            return sw!.dispatchExtendableEvent(event)
                
        }
    }
    
    static func sendClose(_ notification: Notification) -> Promise<Void> {
        return ServiceWorkerInstance.getActiveWorkerByURL(notification.belongsToWorkerURL)
        .then { sw in
            
            let event = NotificationEvent(type: "notificationclose", notification: notification)
            
            return sw!.dispatchExtendableEvent(event)
                
        }
    }
    
    static func sendClick(_ notification: Notification) -> Promise<Void> {
        return ServiceWorkerInstance.getActiveWorkerByURL(notification.belongsToWorkerURL)
            .then { sw in
                
                let event = NotificationEvent(type: "notificationclick", notification: notification)
                
                return sw!.dispatchExtendableEvent(event)
                
        }
    }
    
    
    static func sendAction(_ action:String, notification:Notification) -> Promise<Void> {
        
        return ServiceWorkerInstance.getActiveWorkerByURL(notification.belongsToWorkerURL)
        .then { sw in
            
            let event = NotificationEvent(type: "notificationclick", notification: notification, action: action)
            
            return sw!.dispatchExtendableEvent(event)
            
        }
        
    }
    
    
    /// Notification close is a little confusing. If the notification has been expanded, we want to process
    /// the close event in the same worker, so we do it inside the content extension. However, it still gets fired
    /// in the main app. We don't want to fire notificationclose twice, so we set this flag to have the main app
    /// ignore it. However, it will still process a close event on a notification that was never expanded.
    static var IgnoreNotificationCloseInMainApp: Bool {
        get {
            return SharedResources.userDefaults.object(forKey: "should_ignore_notification_close") as? Bool == true
        }
        set(value) {
            if value == false {
                SharedResources.userDefaults.removeObject(forKey: "should_ignore_notification_close")
            } else {
                SharedResources.userDefaults.set(true, forKey: "should_ignore_notification_close")
            }
        }
    }
    
}
