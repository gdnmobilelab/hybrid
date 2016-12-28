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
    
    var storeNotificationShowWithID:String?
    static var suppressNotificationShow:Bool = false
    
    
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
        log.info("Attempting to show notification: " + title)
        let promise = JSPromise()
        
        var notificationID = NSUUID().UUIDString
       
        if let storeID = self.storeNotificationShowWithID {
            
            // If this is running in response to a push notification we don't want to actually
            // run showNotification() as it'll result in two notifications being shown. Instead,
            // we store the payload to be used if the user opens the notification content view.
            
            notificationID = storeID
            
            log.info("Storing notification data with ID " + storeID)
            
            // We then want to reset it, so that we don't store multiple notifications with this one
            self.storeNotificationShowWithID = nil
            
        } else if let storeID = options["tag"] as? String {
            // This is very gross. But if the notification is inactive, we set the
            // notification request ID to be the tag, to overwrite an existing notification.
            // But if the notification has been expanded, that'll actually stop
            // the notification extension from receiving the event. So we need to detect
            // and handle both.
            
            let l = NSBundle.mainBundle().bundleURL.lastPathComponent!
            
            if NSBundle.mainBundle().bundleURL.lastPathComponent! != "hybrid-notification-content.appex" {
                notificationID = storeID
            }
            
            
//            notificationID = storeID
        }

        
        let pending = PendingNotificationShow(title: title, options: options, pushID: notificationID, workerURL: self.worker.scriptURL)

        PendingNotificationShowStore.add(pending)

        if ServiceWorkerRegistration.suppressNotificationShow == false {
            
            var potentialAttachments: [String] = []
            
            if let icon = options["icon"] as? String {
                potentialAttachments.append(icon)
            }
            
            if let image = options["image"] as? String {
                potentialAttachments.append(image)
            }
            
            if let video = options["video"] {
                if video["preload"] == nil || video["preload"] as? Bool == true {
                    log.info("Found video to attach to notification")
                    potentialAttachments.append(video["url"] as! String)
                } else {
                    log.info("Found video, but with preload set to false, so not downloading")
                }
                
            }
            
            let content = UNMutableNotificationContent()
            content.title = title
            
            content.sound = UNNotificationSound.defaultSound()

            
            if let tag = options["tag"] as? String {
                content.threadIdentifier = tag
            }
            
            PayloadToNotificationContent.urlsToNotificationAttachments(potentialAttachments, relativeTo: self.worker.url)
            .then { attachments -> Void in
                log.info("Fetched potential attachments")
                
                if let body = options["body"] as? String {
                     content.body = body
                }
                
                content.categoryIdentifier = "extended-content"
               
                attachments.forEach { content.attachments.append($0) }
                
                var actionLabels: [String] = []
                
                let maybeActions = options["actions"] as? [AnyObject]
                
                // We save the actions just by numeric index, so all we need for iOS is the title
                if let actions = maybeActions {
                    actionLabels = actions.map { $0["title"] as! String }
                }
                
                // Even if we don't have any actions we might need to reset the category to remove them
                PayloadToNotificationContent.setNotificationCategoryBasedOnActions(actionLabels)
                
                // Add this so that it passes the notification delegate filter and shows when
                // the app is in the foreground
                content.userInfo["app_generated_notification"] = "true"
                
                let request = UNNotificationRequest(identifier: notificationID, content: content, trigger: nil)
                
                UNUserNotificationCenter.currentNotificationCenter().addNotificationRequest(request) { (err) in
                    if err != nil {
                        promise.reject(err!)
                    } else {
                        promise.resolve(nil)
                    }
                    
                }

            }
            
        } else {
            log.info("Suppressing notification show")
            promise.resolve(nil)
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
