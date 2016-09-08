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
        completionHandler()
        
        NotificationDelegate.processAction(response)
        
    }
    
    static func processAction(response:UNNotificationResponse) -> Promise<JSValue> {
        let ui = response.notification.request.content.userInfo
        
        let notificationData = ui["originalNotificationOptions"]!
        
        let workerID = ui[ServiceWorkerRegistration.WORKER_ID] as! Int
        
        var action = ""
        
        if response.actionIdentifier != UNNotificationDefaultActionIdentifier {
            action = response.actionIdentifier
        }
        
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
                    "notification" : notificationData,
                    "action": action
                ]
                
                jsFuncToRun.callWithArguments(["notificationclick", args, cb])
            }

        }
        
        
        
        
    }
    
}

let NotificationDelegateInstance = NotificationDelegate()
