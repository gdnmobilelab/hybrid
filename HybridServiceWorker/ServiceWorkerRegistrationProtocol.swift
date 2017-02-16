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
import HybridShared

//@objc protocol ServiceWorkerRegistrationExports : JSExport {
//    var pushManager:PushManager {get}
//    var scope:String {get}
//    var active:ServiceWorkerInstance? {get}
//    var waiting:ServiceWorkerInstance? {get}
//    var installing:ServiceWorkerInstance? {get}
//    
//    @objc(showNotification::)
//    func showNotification(_ title:String, options: [String:AnyObject]) -> JSPromise
//    
//    @objc(getNotifications:)
//    func getNotifications(_ options: [String:AnyObject]?) -> JSPromise
//    
//    func update() -> JSPromise
//}


/// In an attempt to separate out concerns, HybridServiceWorker does not contain the code to
/// do things like update, notify about other workers in the same scope, etc. etc. - instead
/// we provide this protocol for an outside library to do that (like HybridWorkerManager)
public protocol ServiceWorkerRegistrationProtocol {
    
    var scope:URL {get}
    var scriptURL: URL {get}
    
    var active:ServiceWorkerInstance? {get}
    var waiting: ServiceWorkerInstance? {get}
    var installing: ServiceWorkerInstance? {get}
    
    func showNotification(_ title:String, options: NotificationShowOptions?) -> Promise<Void>
    func getNotifications(_ options: NotificationGetOptions?) -> Promise<[HybridNotification]>
    func update() -> Promise<Void>
}

//
///// A port of web ServiceWorkerRegistration: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration
//@objc class ServiceWorkerRegistration: NSObject, ServiceWorkerRegistrationExports {
//    var pushManager:PushManager
////    var worker:ServiceWorkerInstance
//    
//    let scopeURL: URL
//    let workerURL: URL
//    
//    var storeNotificationShowWithID:String?
//    static var suppressNotificationShow:Bool = false
//    
//    
//    /// For compatibility with the JS API - we need scope to be accessible at the registration level
//    var scope:String {
//        get {
//            return self.scopeURL.absoluteString
//        }
//    }
//    
//    
//    /// We store the workers connected to this one - those that have the same URL and scope, usually
//    /// pending workers that are arriving.
//    fileprivate var relatedWorkers = [RelatedWorkerType: ServiceWorkerInstance?]()
//    
//    public var active:ServiceWorkerInstance? {
//        get {
//            return relatedWorkers[RelatedWorkerType.active]!
//        }
//    }
//    public var waiting:ServiceWorkerInstance? {
//        get {
//            return relatedWorkers[RelatedWorkerType.waiting]!
//        }
//    }
//
//    public var installing:ServiceWorkerInstance? {
//        get {
//            return relatedWorkers[RelatedWorkerType.installing]!
//        }
//    }
//    
//    func setRelatedWorkerByType(worker: ServiceWorkerInstance, relatedType: RelatedWorkerType) {
//        
//        let toCheck: [RelatedWorkerType] = [.installing, .waiting, .active]
//        
//        // First, remove the worker from any existing statuses
//        
//        toCheck.forEach { status in
//            if self.relatedWorkers[status]! == worker {
//                self.relatedWorkers[status] = nil
//            }
//        }
//        
//        self.relatedWorkers[relatedType] = worker
//    }
//    
//    init(scope: URL, workerURL: URL) {
//        self.pushManager = PushManager()
//        self.scopeURL = scope
//        self.workerURL = workerURL
//    }
//    
//    
//    /// No idea why, but identifiers with dashes in them seem to be problematic.
//    func makeTagNameSafe(_ tag:String) -> String {
//        return tag.addingPercentEncoding(withAllowedCharacters: CharacterSet.alphanumerics)!
//    }
//    
//    @objc(showNotification::)
//    /// Show a notification locally, without going through any remote notification handlers.
//    ///
//    /// - Parameters:
//    ///   - title: The text for the notification title
//    ///   - options: Options object as outlined here: https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration/showNotification,
//    ///              with additional options for canvas and video.
//    func showNotification(_ title:String, options: [String:AnyObject]) -> JSPromise {
//        log.info("Attempting to show notification: " + title)
//        let promise = JSPromise()
//        
//        var notificationID = UUID().uuidString
//        
//        if let storeID = self.storeNotificationShowWithID {
//            
//            // If this is running in response to a push notification we don't want to actually
//            // run showNotification() as it'll result in two notifications being shown. Instead,
//            // we store the payload to be used if the user opens the notification content view.
//            
//            notificationID = storeID
//            
//            log.info("Storing notification data with ID " + storeID)
//            
//            // We then want to reset it, so that we don't store multiple notifications with this one
//            self.storeNotificationShowWithID = nil
//            
//        } else if let storeID = options["tag"] as? String {
//            // This is very gross. But if the notification is inactive, we set the
//            // notification request ID to be the tag, to overwrite an existing notification.
//            // But if the notification has been expanded, that'll actually stop
//            // the notification extension from receiving the event. So we need to detect
//            // and handle both.
//            
//            if Bundle.main.bundleURL.lastPathComponent != "hybrid-notification-content.appex" {
//                notificationID = makeTagNameSafe(storeID)
//            }
//            
//        }
//        
//        
//        let pending = PendingNotificationShow(title: title, options: options, pushID: notificationID, workerURL: self.workerURL.absoluteString)
//        
//        PendingNotificationShowStore.add(pending)
//        
//        if ServiceWorkerRegistration.suppressNotificationShow == false {
//            
//            var potentialAttachments: [String] = []
//            
//            if let icon = options["icon"] as? String {
//                potentialAttachments.append(icon)
//            }
//            
//            if let image = options["image"] as? String {
//                potentialAttachments.append(image)
//            }
//            
//            if let video = options["video"] {
//                if video["preload"] == nil || video["preload"] as? Bool == true {
//                    log.info("Found video to attach to notification")
//                    potentialAttachments.append(video["url"] as! String)
//                } else {
//                    log.info("Found video, but with preload set to false, so not downloading")
//                }
//                
//            }
//            
//            let content = UNMutableNotificationContent()
//            
//            // We have the ability to provide different collapsed titles and bodies on iOS,
//            // if we want. Not a Notification API feature, but playing around with it to see if
//            // we find it useful or not.
//            
//            let collapsed = options["collapsed"] as? [String: AnyObject]
//            
//            if let collapsedTitle = collapsed?["title"] as? String {
//                content.title = collapsedTitle
//            } else {
//                content.title = title
//            }
//            
//            if let collapsedBody = collapsed?["body"] as? String {
//                content.body = collapsedBody
//            }
//            else if let body = options["body"] as? String {
//                content.body = body
//            }
//            
//            let maybeSilent = options["silent"] as? String
//            
//            if maybeSilent == "true" {
//                content.sound = nil
//            } else {
//                content.sound = UNNotificationSound.default()
//            }
//            
//            
//            if let tag = options["tag"] as? String {
//                content.threadIdentifier = makeTagNameSafe(tag)
//            }
//            
//            PayloadToNotificationContent.urlsToNotificationAttachments(potentialAttachments, relativeTo: self.workerURL)
//                .then { attachments -> Void in
//                    log.info("Fetched potential attachments")
//                    
//                    
//                    
//                    content.categoryIdentifier = "extended-content"
//                    
//                    attachments.forEach { content.attachments.append($0) }
//                    
//                    var actionLabels: [String] = []
//                    
//                    let maybeActions = options["actions"] as? [AnyObject]
//                    
//                    // We save the actions just by numeric index, so all we need for iOS is the title
//                    if let actions = maybeActions {
//                        actionLabels = actions.map { $0["title"] as! String }
//                    }
//                    
//                    // Even if we don't have any actions we might need to reset the category to remove them
//                    PayloadToNotificationContent.setNotificationCategoryBasedOnActions(actionLabels)
//                    
//                    // Add this so that it passes the notification delegate filter and shows when
//                    // the app is in the foreground
//                    content.userInfo["app_generated_notification"] = "true"
//                    
//                    let request = UNNotificationRequest(identifier: notificationID, content: content, trigger: nil)
//                    
//                    UNUserNotificationCenter.current().add(request) { (err) in
//                        if err != nil {
//                            promise.reject(err!)
//                        } else {
//                            promise.resolve(nil)
//                        }
//                        
//                    }
//                    
//                }
//                .catch { err in
//                    log.error("Failed to create notification request: " + String(describing: err))
//            }
//            
//        } else {
//            log.info("Suppressing notification show")
//            promise.resolve(nil)
//        }
//        
//        return promise
//        
//    }
//    
//    
//    /// Update the current service worker.
//    func update() -> JSPromise {
//        let argh = Promise<Void>(error: ErrorMessage("Need to re-implement this"))
//        
//        return PromiseToJSPromise.pass(argh)
////        return PromiseToJSPromise.pass(ServiceWorkerManager.update(self.worker.url, scope: nil, forceCheck: true))
//    }
//    
//    @objc(getNotifications:)
//    func getNotifications(_ options: [String:AnyObject]?) -> JSPromise {
//        let promise = Promise<[Notification]> { fulfill, reject in
//            UNUserNotificationCenter.current().getDeliveredNotifications(completionHandler: { notifications in
//                
//                let allPending = PendingNotificationShowStore.getAll()
//                
//                var mappedObjects = notifications.map { nativeNotification -> Notification in
//                    let pending = allPending.first { $0.pushID == nativeNotification.request.identifier }
//                    return Notification.fromNotificationShow(pending!)
//                }
//                
//                if let tag = options?["tag"] as? String {
//                    mappedObjects = mappedObjects.filter { $0.tag == tag }
//                }
//                
//                fulfill(mappedObjects)
//                
//            })
//        }
//        
//        return PromiseToJSPromise<[Notification]>.pass(promise)
//    }
//}
