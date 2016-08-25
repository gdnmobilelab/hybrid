//
//  NotificationDelegate.swift
//  hybrid
//
//  Created by alastair.coote on 24/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UserNotifications

class NotificationDelegate : NSObject, UNUserNotificationCenterDelegate {
    
    func userNotificationCenter(center: UNUserNotificationCenter, willPresentNotification notification: UNNotification, withCompletionHandler completionHandler: (UNNotificationPresentationOptions) -> Void) {
        completionHandler(UNNotificationPresentationOptions.Alert)
    }
    
    func userNotificationCenter(center: UNUserNotificationCenter, didReceiveNotificationResponse response: UNNotificationResponse, withCompletionHandler completionHandler: () -> Void) {
        completionHandler()
        
        let ui = response.notification.request.content.userInfo
        
        let notificationData = ui["originalNotificationOptions"]!
        
        let workerURL = NSURL(string: ui["workerURL"] as! String)!
        
        ServiceWorkerManager.getServiceWorkerForURL(workerURL)
        .then { sw -> Void in
            
            let jsFuncToRun = sw!.jsContext.objectForKeyedSubscript("hybrid")
                .objectForKeyedSubscript("dispatchExtendableEvent")!
            
            let args = [
                "notification" : notificationData,
                "action": response.actionIdentifier
            ]
            
            jsFuncToRun.callWithArguments(["notificationclick", args])
        }
        
        NSLog("Got to here")
    }
    
}

let NotificationDelegateInstance = NotificationDelegate()
