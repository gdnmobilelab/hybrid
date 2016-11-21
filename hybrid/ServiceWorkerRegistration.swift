//
//  ServiceWorkerRegistration.swift
//  hybrid
//
//  Created by alastair.coote on 23/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UserNotifications
import JavaScriptCore
import PromiseKit

@objc protocol ServiceWorkerRegistrationExports : JSExport {
    var pushManager:PushManager {get}
    var scope:String {get}
    var active:ServiceWorkerInstance? {get}
    var waiting:ServiceWorkerInstance? {get}
    var installing:ServiceWorkerInstance? {get}
    
    @objc(showNotification::)
    func showNotification(title:String, options: [String:AnyObject]) -> JSPromise
    
    func update() -> JSPromise
}


/// A port of web ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration
@objc class ServiceWorkerRegistration: NSObject, ServiceWorkerRegistrationExports {
    var pushManager:PushManager
    var worker:ServiceWorkerInstance
    
    /// For compatibility with the JS API - we need scope to be accessible at the registration level
    var scope:String {
        get {
            return self.worker.scope.absoluteString!
        }
    }
    
    // All three of these need some work - in the web API you could have both installing and activated workers
    // at once. The way we've got this, it's just one worker switching attributes depending on current status.
    
    // TODO: We need to track current workers while new ones are being installed, etc.
    
    
    /// Return the current service worker if it is in an Activated state.
    var active:ServiceWorkerInstance? {
        get {
            return self.worker.installState == ServiceWorkerInstallState.Activated ? self.worker : nil
        }
    }
    
    /// Return the current service worker if it is in an Installed state
    var waiting:ServiceWorkerInstance? {
        get {
            return self.worker.installState == ServiceWorkerInstallState.Installed ? self.worker : nil
        }
    }
    
    /// Return the current service worker if it is in an Installing state
    var installing:ServiceWorkerInstance? {
        get {
            return self.worker.installState == ServiceWorkerInstallState.Installing ? self.worker : nil
        }
    }

    
    init(worker:ServiceWorkerInstance) {
        self.pushManager = PushManager()
        self.worker = worker
    }
    
    @objc(showNotification::)
    /// Show a notification locally, without going through any remote notification handlers.
    ///
    /// - Parameters:
    ///   - title: The text for the notification title
    ///   - options: Options object as outlined here: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification,
    ///              with additional options for canvas and video.
    func showNotification(title:String, options: [String:AnyObject]) -> JSPromise {
        
        let payload = [
            "title": title,
            "options": options
        ]
        
        let promise = JSPromise()
        
        PayloadToNotificationContent.Convert(payload, serviceWorkerScope: self.scope)
        .then { content -> Void in
            
            // We use a UUID because remote notifications can't change their identifier. This means
            // we have to manually manage replacing notifications with the same tag. Bah.
            
            let request = UNNotificationRequest(identifier: NSUUID().UUIDString, content: content, trigger: nil)
            
            UNUserNotificationCenter.currentNotificationCenter().addNotificationRequest(request) { (err) in
                NSLog(String(err))
                promise.resolve(nil)
            }
        }
        .recover  { err -> Void in
            log.error("Failed to post notification: " + String(err))
            promise.reject(err)
        }
        
        return promise
       
    }
    
    
    /// Update the current service worker.
    func update() -> JSPromise {
        return PromiseToJSPromise.pass(ServiceWorkerManager.update(self.worker.url, scope: nil, forceCheck: true).then { i in
                // Int isn't AnyObject. Swift is weird.
                return NSNumber(integer: i)
            })
        
    }
}
