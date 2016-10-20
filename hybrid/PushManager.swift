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
    
    override required init() {
        super.init()
    }
    
    func getSubscriptionCallback(success: JSValue, failure: JSValue) {
        
        if PushManager.deviceToken == nil {
            failure.callWithArguments([JSValue(newErrorFromMessage: "Not registered for remote notifications", inContext: failure.context)])
            return
        }
        
        let appName = NSBundle.mainBundle().bundleIdentifier!
        
        let returnObj = [
            "platform": "iOS",
            "bundle_name": appName,
            "device_id" : PushManager.deviceToken!
        ]
        
        success.callWithArguments([returnObj])
    }
}
