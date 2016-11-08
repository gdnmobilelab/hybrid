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
import UserNotifications

class NotificationPermissionHandler: ScriptMessageManager {

    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "notifications")
    }
    
    func getAuthStatus() -> Promise<UNAuthorizationStatus> {
        return Promise<UNAuthorizationStatus> { fulfill, reject in
            UNUserNotificationCenter.currentNotificationCenter().getNotificationSettingsWithCompletionHandler { (settings:UNNotificationSettings) in
                fulfill(settings.authorizationStatus)
            }
        }
    }
    
    func authStatusToBrowserString(status:UNAuthorizationStatus) -> String {
        if status == UNAuthorizationStatus.Authorized {
            return "granted"
        }
        if status == UNAuthorizationStatus.Denied {
            return "denied"
        }
        
        return "default"
    }
    
    private func makeJSONSafe(str:String) -> String {
        return "\"" + str + "\""
    }
    
    override func handleMessage(message:AnyObject) -> Promise<String>? {
        
        let operation = message["operation"] as! String
        
        if operation == "getStatus" {
            
            return getAuthStatus()
            .then { authStatus in
                return self.makeJSONSafe(self.authStatusToBrowserString(authStatus))
            }

        }
        
        if operation == "requestPermission" {
            
            return self.getAuthStatus()
            .then { authStatus -> Promise<String> in
                if authStatus != UNAuthorizationStatus.NotDetermined {
                    return Promise<String>(self.makeJSONSafe(self.authStatusToBrowserString(authStatus)))
                }
                
                return Promise<Bool> {fulfill, reject in
                    UIApplication.sharedApplication().registerForRemoteNotifications()
                    UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptions([.Alert, .Sound, .Badge], completionHandler: { (result:Bool, err:NSError?) in
                        
                        if err != nil {
                            reject(err!)
                        }
                        ApplicationEvents.once("didRegisterForRemoteNotificationsWithDeviceToken", {_ in 
                            fulfill(result)
                        })
                        
                        
                    })
                }
                .then { gavePermission -> String in
                    
                    let result:String
                    
                    if gavePermission == false {
                        result = "denied"
                    } else {
                        result = "granted"
                    }
                    
                    return self.makeJSONSafe(result)
                }
                .then { newStatus -> String in
                    self.sendEvent("notification-permission-change", arguments: [newStatus])
                    return newStatus
                }
            }
            
            
            
        }
        
        log.error("Unknown notification operation: " + operation)
        return Promise<String>("null")
    }
}
