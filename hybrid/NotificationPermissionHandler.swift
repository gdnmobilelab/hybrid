//
//  NotificationStatus.swift
//  hybrid
//
//  Created by alastair.coote on 23/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import WebKit
import PromiseKit


class NotificationPermissionHandler: ScriptMessageManager {

    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "notifications")
    }
    
    func hasNotificationPermission() -> Bool {
        let notificationType = UIApplication.sharedApplication().currentUserNotificationSettings()!.types
        return notificationType != UIUserNotificationType.None
    }
    
    override func handleMessage(message:AnyObject) -> Promise<String>? {
        
        let operation = message["operation"] as! String
        
        let userDefaults = NSUserDefaults.standardUserDefaults()
        
        if operation == "getStatus" {
            
            var setting = userDefaults.stringForKey("userPermissionNotification")
            
            if self.hasNotificationPermission() == true && setting != "granted" {
                // Despite saved settings, users can manually enable notifications
                // so let's check if they have done that.
                
                userDefaults.setValue("granted", forKey: "userPermissionNotification")
                setting = "granted"
            }
            
            
            if setting == nil {
                // We haven't asked.
                return Promise<String>("\"default\"")
            }
            
            return Promise<String>("\"" + setting! + "\"")

        }
        
        if operation == "requestPermission" {
            
            return Promise<Void>()
            .then { () -> Promise<String> in
                if self.hasNotificationPermission() == true {
                    return Promise<String>("\"granted\"")
                }
                
                return Promise<String> {fulfill, reject in
                    ApplicationEvents.once("didRegisterUserNotificationSettings", { _ in
                        
                        let result:String
                        
                        if self.hasNotificationPermission() == false {
                            result = "denied"
                        } else {
                            result = "granted"
                        }
                        
                        userDefaults.setValue(result, forKey: "userPermissionNotification")
                        fulfill("\"" + result + "\"")
                        
                    })
                    
                    let settings = UIUserNotificationSettings(forTypes: [.Badge, .Sound, .Alert], categories: nil)
                    UIApplication.sharedApplication().registerUserNotificationSettings(settings)
                }
            }
            .then { newStatus -> String in
                self.sendEvent("notification-permission-change", arguments: [newStatus])
                return newStatus
            }
            
            
        }
        
        log.error("Unknown notification operation: " + operation)
        return Promise<String>("null")
    }
}
