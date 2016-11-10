//
//  PushManager.swift
//  hybrid
//
//  Created by alastair.coote on 23/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import EmitterKit
import JavaScriptCore

@objc protocol PushSubscriptionExports : JSExport {
    
}

@objc class PushSubscription : NSObject, PushSubscriptionExports {
    
}

@objc protocol PushManagerExports : JSExport {
    func getSubscriptionCallback(success: JSValue, failure: JSValue)
    func subscribeCallback(success: JSValue, failure: JSValue)
    init()
}

@objc class PushManager : NSObject, PushManagerExports {
    
    private static var deviceTokenListener:Listener?
    private static var deviceToken:String?
    
    static func listenForDeviceToken() {
        self.deviceTokenListener = ApplicationEvents.on("didRegisterForRemoteNotificationsWithDeviceToken", { token in
            let deviceToken = token as! NSData
            
            // From http://stackoverflow.com/a/24979958/470339
            
            let tokenChars = UnsafePointer<CChar>(deviceToken.bytes)
            var tokenString = ""
            
            for i in 0..<deviceToken.length {
                tokenString += String(format: "%02.2hhx", arguments: [tokenChars[i]])
            }

            self.deviceToken = tokenString
        })
    }
    
    static func isAPNSSandbox() -> Bool {
        #if IS_DEBUG
            return true
        #else
            return false
        #endif
    }
    
    override required init() {
        super.init()
    }
    
    func subscribeCallback(success: JSValue, failure: JSValue) {
        if PushManager.deviceToken == nil {
            
            // There is a slight delay in receiving the remote device token. So if we've
            // called subscribe as opposed to get, we wait for it.
            
            // We should be calling UIApplication.sharedApplication().registerForRemoteNotifications()
            // here, but it's not available in the notification-content context, so we can't.
            // Instead, we call it when we request notification permission in
            // NotificationPermissionHandler.swift
            
            ApplicationEvents.once("didRegisterForRemoteNotificationsWithDeviceToken", { _ in
                self.getSubscriptionCallback(success, failure: failure)
            })
        } else {
            self.getSubscriptionCallback(success, failure: failure)
        }
    }
    
    func getSubscriptionCallback(success: JSValue, failure: JSValue) {
        
        if PushManager.deviceToken == nil {
            
            // If we don't have the device token yet then we don't technically have a
            // subscription.
            
            success.callWithArguments([JSValue(nullInContext: success.context)])
            
//            failure.callWithArguments([JSValue(newErrorFromMessage: "Not registered for remote notifications", inContext: failure.context)])
            return
        }
        
        let appName = NSBundle.mainBundle().bundleIdentifier!
        
        let returnObj = [
            "platform": "iOS",
            "bundle_name": appName,
            "device_id" : PushManager.deviceToken!,
            "sandbox": PushManager.isAPNSSandbox()
        ]
        
        success.callWithArguments([returnObj])
    }
}
