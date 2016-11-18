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
    var platform:String {get}
    var bundle_name:String {get}
    var device_id:String {get}
    var sandbox:Bool {get}
    func toJSON() -> AnyObject
}


/// In theory this is an implementation of https://developer.mozilla.org/en-US/docs/Web/API/
/// PushSubscription, but the keys are totally different, because native notifications are
/// handled very differently.
@objc class PushSubscription : NSObject, PushSubscriptionExports {
    var platform = "iOS"
    var bundle_name:String
    var device_id:String
    var sandbox:Bool
    
    init(bundleName: String, deviceId:String, sandbox:Bool) {
        self.bundle_name = bundleName
        self.device_id = deviceId
        self.sandbox = sandbox
    }
    
    
    /// Seems somewhat redundant, but it's in the spec, so we'll recreate it
    ///
    /// - Returns: an object with all the keys of the PushSubscription
    func toJSON() -> AnyObject {
        return [
            "platform": self.platform,
            "device_id": self.device_id,
            "bundle_name": self.bundle_name,
            "sandbox": self.sandbox
        ]
    }
}

@objc protocol PushManagerExports : JSExport {
    func getSubscriptionCallback(success: JSValue, failure: JSValue)
    func subscribeCallback(success: JSValue, failure: JSValue)
    init()
}


/// Implementation of https://developer.mozilla.org/en-US/docs/Web/API/PushManager, except
/// that functions are wrapped in callbacks. They're then wrapped in JS promises in js-src
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
        
        let appName = Util.appBundle().bundleIdentifier!
        
        let returnObj = PushSubscription(bundleName: appName, deviceId: PushManager.deviceToken!, sandbox: PushManager.isAPNSSandbox())
        
        success.callWithArguments([returnObj])
    }
}
