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


/// Handles Notification.requestPermission(): https://developer.mozilla.org/en-US/docs/Web/API/Notification/requestPermission
class NotificationPermissionHandler: ScriptMessageManager {

    init(userController:WKUserContentController, webView:HybridWebview) {
        super.init(userController: userController, webView: webView, handlerName: "notifications")
    }
    
    
    /// A promise wrapper around fetching the current notification status
    ///
    /// - Returns: A promise that resolves with the current status
    func getAuthStatus() -> Promise<UNAuthorizationStatus> {
        return Promise<UNAuthorizationStatus> { fulfill, reject in
            UNUserNotificationCenter.currentNotificationCenter().getNotificationSettingsWithCompletionHandler { (settings:UNNotificationSettings) in
                fulfill(settings.authorizationStatus)
            }
        }
    }
    
    
    /// Converts a UNAuthorizationStatus into a browser-friendly status, as outlined
    /// in; https://notifications.spec.whatwg.org/#permission-model
    ///
    /// - Parameter status: The UNAuthorizationStatus
    /// - Returns: A string derived from the status
    func authStatusToBrowserString(_ status:UNAuthorizationStatus) -> String {
        if status == UNAuthorizationStatus.authorized {
            return "granted"
        }
        if status == UNAuthorizationStatus.denied {
            return "denied"
        }
        
        return "default"
    }
    
    
    /// Just wraps a string in quote marks. Could probably work on that.
    ///
    /// - Parameter str: "test"
    /// - Returns: "\"test\""
    fileprivate func makeJSONSafe(_ str:String) -> String {
        return "\"" + str + "\""
    }
    
    
    /// The actual request function. Sends request out to OS and waits for response
    ///
    /// - Returns: A promise that resolves with the browser-friendly string based on the user preference
    fileprivate func requestPermission() -> Promise<String> {
        return self.getAuthStatus()
        .then { authStatus -> Promise<String> in
            if authStatus != UNAuthorizationStatus.NotDetermined {
                return Promise<String>(self.makeJSONSafe(self.authStatusToBrowserString(authStatus)))
            }
            
            return Promise<Bool> {fulfill, reject in
                
                // This is actually in the wrong place - it should be in PushManager.subscribe()
                // but that is accessible inside notification-content, and content doesn't
                // have access to sharedApplication(). So we grab the remote token earlier
                // than we necessarily need to.
                
                UIApplication.sharedApplication().registerForRemoteNotifications()
                UNUserNotificationCenter.currentNotificationCenter().requestAuthorizationWithOptions([.Alert, .Sound, .Badge], completionHandler: { (result:Bool, err:NSError?) in
                    
                    if err != nil {
                        reject(err!)
                    }
                    
                    fulfill(result)
                    
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
        }

    }
    
    
    /// Handle incoming JS messages.
    ///
    /// - Parameter message: Message is an object with a key "operation", which must equal getStatus or requestPermission
    /// - Returns: In both cases it will return a string with the current permission in it
    override func handleMessage(_ message:AnyObject) -> Promise<String>? {
        
        let operation = message["operation"] as! String
        
        if operation == "getStatus" {
            
            return getAuthStatus()
            .then { authStatus in
                return self.makeJSONSafe(self.authStatusToBrowserString(authStatus))
            }

        }
        
        if operation == "requestPermission" {
            
            return self.requestPermission()
            .then { newStatus -> String in
                self.sendEvent("notification-permission-change", arguments: [newStatus])
                return newStatus
            }
            
            
        }
        
        log.error("Unknown notification operation: " + operation)
        return Promise<String>("null")
    }
}
