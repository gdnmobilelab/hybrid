//
//  PushManager.swift
//  hybrid
//
//  Created by alastair.coote on 23/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit

@objc protocol PushSubscriptionExports : JSExport {
    var platform:String {get}
    var bundle_name:String {get}
    var device_id:String {get}
    var sandbox:Bool {get}
    func toJSON() -> Any
}

class CannotEnablePushNotificationsError : Error {}

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
    func toJSON() -> Any {
        return [
            "platform": self.platform,
            "device_id": self.device_id,
            "bundle_name": self.bundle_name,
            "sandbox": self.sandbox
        ]
    }
}

@objc protocol PushManagerExports : JSExport {
    
    func subscribe() -> JSPromise
    func getSubscription() -> JSPromise
}


/// Implementation of https://developer.mozilla.org/en-US/docs/Web/API/PushManager, except
/// that functions are wrapped in callbacks. They're then wrapped in JS promises in js-src
@objc class PushManager : NSObject, PushManagerExports {
    
    fileprivate static var deviceTokenListener:Listener<Any>?
    fileprivate static var deviceToken:String?
    
    static func listenForDeviceToken() {
        self.deviceTokenListener = ApplicationEvents.on("didRegisterForRemoteNotificationsWithDeviceToken", { token in
            let deviceToken = token as! Data
            
            // From http://stackoverflow.com/a/24979958/470339
            
            var token: String = ""
            for i in 0..<deviceToken.count {
                token += String(format: "%02.2hhx", deviceToken[i] as CVarArg)
            }

            self.deviceToken = token
        })
    }
    
    static func isAPNSSandbox() -> Bool {
        #if IS_DEBUG
            return true
        #else
            return false
        #endif
    }

    func _subscribe() -> Promise<PushSubscription> {
        
        let sub = self._getSubscription()
        
        if sub != nil {
            
            return Promise(value: sub!)
            
        } else {
            
            return Promise(value: ())
            .then {
                let isSimulator = ProcessInfo.processInfo.environment["SIMULATOR_DEVICE_NAME"] != nil
                
                if isSimulator {
                    throw CannotEnablePushNotificationsError()
                }
                
                // There is a slight delay in receiving the remote device token. So if we've
                // called subscribe as opposed to get, we wait for it.
                
                // We should be calling UIApplication.sharedApplication().registerForRemoteNotifications()
                // here, but it's not available in the notification-content context, so we can't.
                // Instead, we call it when we request notification permission in
                // NotificationPermissionHandler.swift

                
                return Promise<PushSubscription> { fulfill, reject in
                    ApplicationEvents.once("didRegisterForRemoteNotificationsWithDeviceToken", { _ in
                        fulfill(self._getSubscription()!)
                    })
                }
            
            }
             
            
        }
    }
    
    func subscribe() -> JSPromise {
        return PromiseToJSPromise.pass(self._subscribe())
    }
    
    func getSubscription() -> JSPromise {
        return JSPromise.resolve(self._getSubscription())
    }

    
    func _getSubscription() -> PushSubscription? {
        if PushManager.deviceToken == nil {
            
            // If we don't have the device token yet then we don't technically have a
            // subscription.
            
            return nil

        } else {
            let appName = Util.appBundle().bundleIdentifier!
            
            let returnObj = PushSubscription(bundleName: appName, deviceId: PushManager.deviceToken!, sandbox: PushManager.isAPNSSandbox())
            
            return returnObj
        }

    }
    
}
