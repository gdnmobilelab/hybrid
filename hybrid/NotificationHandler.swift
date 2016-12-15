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
    
    static private func createNotification(notificationShow: PendingNotificationShow, activeViews:ActiveNotificationViews? = nil) -> Notification {
        
        let notification = Notification(title: notificationShow.title, notificationData: notificationShow.options)
        
        if let existingActiveViews = activeViews {
            notification.video = existingActiveViews.video
            notification.canvas = existingActiveViews.canvas
        }
        
        return notification
        
    }
    
   
    /// This isn't a standard event, but we can use it for analytics tracking
    ///
    /// - Parameter notificationShow: the cached notification show call
    /// - Returns: A promise that resolves when the event is complete
    static func sendExpand(notificationShow: PendingNotificationShow) -> Promise<Void> {
        return ServiceWorkerInstance.getActiveWorkerByURL(notificationShow.workerURL)
        .then { sw in
            
            let notification = createNotification(notificationShow)
            
            let event = NotificationEvent(type: "notificationexpand", notification: notification)
            
            return sw!.dispatchExtendableEvent(event)
                
        }
    }
    
    static func sendClose(notificationShow: PendingNotificationShow) -> Promise<Void> {
        return ServiceWorkerInstance.getActiveWorkerByURL(notificationShow.workerURL)
        .then { sw in
            
            let notification = createNotification(notificationShow)
            
            let event = NotificationEvent(type: "notificationclose", notification: notification)
            
            return sw!.dispatchExtendableEvent(event)
                
        }
    }
    
    static func sendClick(notificationShow: PendingNotificationShow) -> Promise<Void> {
        return ServiceWorkerInstance.getActiveWorkerByURL(notificationShow.workerURL)
            .then { sw in
                
                let notification = createNotification(notificationShow)
                
                let event = NotificationEvent(type: "notificationclick", notification: notification)
                
                return sw!.dispatchExtendableEvent(event)
                
        }
    }
    
    
    static func sendAction(action:String, notificationShow:PendingNotificationShow, activeViews:ActiveNotificationViews) -> Promise<Void> {
        
        return ServiceWorkerInstance.getActiveWorkerByURL(notificationShow.workerURL)
        .then { sw in
            
            let notification = createNotification(notificationShow, activeViews: activeViews)
            
            let event = NotificationEvent(type: "notificationclick", notification: notification, action: action)
            
            return sw!.dispatchExtendableEvent(event)
            
        }
        
    }
    
}
