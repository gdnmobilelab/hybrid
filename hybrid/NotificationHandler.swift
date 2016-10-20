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
    
    static var urlToOpen:String? {
        get {
            return getValue("pendingNotifications.urlToOpen") as? String
        }
        
        set(val) {
            setValue("pendingNotifications.urlToOpen", val: val)
        }
    }
    
    static func reset() {
        self.closeNotification = nil
        self.urlToOpen = nil
    }
}

class NotificationHandler {
    static func processAction(response:UNNotificationResponse, userInfo:[NSObject: AnyObject]) -> Promise<JSValue> {
       
        let notificationData = userInfo["originalNotificationOptions"]!
        
        let notification = Notification(title: userInfo["originalTitle"] as! String)
        notification.body = notificationData["body"] as? String
        notification.tag = notificationData["tag"] as? String
        notification.actions = notificationData["actions"] as? [AnyObject]
        notification.icon = notificationData["icon"] as? String
        notification.image = notificationData["image"]
        notification.data = notificationData["data"]
        
        let workerID = userInfo[ServiceWorkerRegistration.WORKER_ID] as! Int
        
        var action = ""
        
        if response.actionIdentifier != UNNotificationDefaultActionIdentifier {
            action = response.actionIdentifier
        }
        
        // We need this to keep track of the actions we want to take place in both
        // the app and the notification
        
        return Promise<JSValue> { fulfill, reject in
            let returnFunc = { (err: JSValue, success:JSValue) in
                if err.isNull {
                    fulfill(success)
                    return
                }
                
                reject(JSContextError(jsValue: err))
            }
            
            let cb = JSCallbackWrapper(callbackFunc: returnFunc)
            
            ServiceWorkerInstance.getById(workerID)
                .then { sw -> Void in
                    
                    let jsFuncToRun = sw!.jsContext.objectForKeyedSubscript("hybrid")
                        .objectForKeyedSubscript("dispatchExtendableEvent")!
                    
                    let args = [
                        "notification" : notification,
                        "action": action
                    ]
                    jsFuncToRun.callWithArguments(["notificationclick", args, cb])
            }
            
        }
        
        
        
        
    }
}
