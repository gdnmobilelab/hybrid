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

@objc protocol ServiceWorkerRegistrationWrapperExports : JSExport {
//    var pushManager:PushManager {get}
    var scope:String {get}
    var active:ServiceWorkerInstance? {get}
    var waiting:ServiceWorkerInstance? {get}
    var installing:ServiceWorkerInstance? {get}
    
    @objc(showNotification::)
    func showNotification(_ title:String, options: [String:AnyObject]) -> JSPromise
    
    @objc(getNotifications:)
    func getNotifications(_ options: [String:AnyObject]?) -> JSPromise
    
    func update() -> JSPromise
}


/// A wrapper around the ServiceWorkerRegistration protocol, mostly just to convert promises to JSPromises
/// and converting JavaScript objects into Swift classes
@objc class ServiceWorkerRegistrationWrapper: NSObject, ServiceWorkerRegistrationWrapperExports {
    
    let registrationInstance:ServiceWorkerRegistrationProtocol
    
    init(instance: ServiceWorkerRegistrationProtocol) {
        self.registrationInstance = instance
    }
   
    
    var scope:String {
        get {
            return registrationInstance.scope.absoluteString
        }
    }
    
    var active:ServiceWorkerInstance? { get { return self.registrationInstance.active } }
    var waiting:ServiceWorkerInstance? { get { return self.registrationInstance.waiting } }
    var installing:ServiceWorkerInstance? { get { return self.registrationInstance.installing } }
    
    @objc(showNotification::)
    func showNotification(_ title: String, options: [String : AnyObject]) -> JSPromise {
        
        let promise = Promise(value: ())
        .then { () -> Promise<Void> in
            
            var actions: [NotificationAction]? = nil
            
            if let actionObjects = options["actions"] as? [[String : AnyObject]] {
                
                actions = try actionObjects.map { obj in
                    let title = obj["title"] as? String
                    let icon = obj["icon"] as? String
                    let action = obj["action"] as? String
                    
                    if (title == nil || action == nil || title == "" || action == "") {
                        throw ErrorMessage("Notification actions must have both a title and action")
                    }
                    
                    let iconURL:URL? = URLOrNilFromString(icon, relativeTo: self.registrationInstance.scriptURL)
                    
                    return NotificationAction(action: action!, title: title!, icon: iconURL)
                }
                
            }
            
            let renotify = options["renotify"] as? Bool
            
            let options = NotificationShowOptions(
                actions: actions,
                badge: URLOrNilFromString(options["badge"] as? String, relativeTo: self.registrationInstance.scriptURL),
                body: options["body"] as? String,
                icon: URLOrNilFromString(options["icon"] as? String, relativeTo: self.registrationInstance.scriptURL),
                image: URLOrNilFromString(options["image"] as? String, relativeTo: self.registrationInstance.scriptURL),
                renotify: renotify != nil ? renotify! : false,
                tag: options["tag"] as? String,
                vibrate: options["vibrate"] as? [Int],
                data: options["data"]
            )
            
            return self.registrationInstance.showNotification(title, options: options)
            
        }
        
        return PromiseToJSPromise.pass(promise)
        
    }
    
    @objc(getNotifications:)
    func getNotifications(_ options: [String : AnyObject]?) -> JSPromise {
        
        var opts: NotificationGetOptions? = nil
        
        if let tag = options?["tag"] as? String {
            opts = NotificationGetOptions(tag: tag)
        }
        
        return PromiseToJSPromise<[HybridNotification]>.pass(self.registrationInstance.getNotifications(opts))
        
    }
    
    func update() -> JSPromise {
        
        return PromiseToJSPromise.pass(self.registrationInstance.update())
    }
}
