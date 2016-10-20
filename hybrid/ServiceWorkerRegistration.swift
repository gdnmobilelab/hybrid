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
    func showNotification(title:String, options: [String:AnyObject])
}

@objc class ServiceWorkerRegistration: NSObject, ServiceWorkerRegistrationExports {
    var pushManager:PushManager
    var worker:ServiceWorkerInstance
    
    
    // We use this in our notification extension - in the web APIs push and notifications
    // are totally separate, but they aren't in iOS. So, if we happen to be running inside
    // the extension and intercepting a notification, rather than run the normal local
    // notification show functions, we call this content handler.
    
    static var notificationExtensionContentHandler: ((UNNotificationContent) -> Void)? = nil
    
    static let WORKER_ID = "workerID"
    
    var scope:String {
        get {
            return self.worker.scope.absoluteString!
        }
    }
    
    init(worker:ServiceWorkerInstance) {
        self.pushManager = PushManager()
        self.worker = worker
    }
    
    static let assetStoreDirectory = Fs.sharedStoreURL.URLByAppendingPathComponent("NotificationStore", isDirectory: true)!
    
    static func getStoredPathForURL(url:NSURL) -> NSURL {
        
        let escapedAssetURL = url.absoluteString!.stringByAddingPercentEncodingWithAllowedCharacters(NSCharacterSet.alphanumericCharacterSet())!
        
        return assetStoreDirectory
            .URLByAppendingPathComponent(escapedAssetURL)!
            .URLByAppendingPathExtension(url.pathExtension!)!
    }
    
    private func getIcon(options: [String:AnyObject], content:UNMutableNotificationContent) -> Promise<Void> {
        
        if options["icon"] == nil {
            return Promise<Void>()
        }
        
        let icon = options["icon"] as! String
        
        let iconURL = NSURL(string: icon, relativeToURL: NSURL(string:self.scope)!)!
        
        return self.worker.dispatchFetchEvent(FetchRequest(url: iconURL.absoluteString!, options: nil))
        .then { r in
            
            let destPath = ServiceWorkerRegistration.getStoredPathForURL(iconURL)
            
            if NSFileManager.defaultManager().fileExistsAtPath(ServiceWorkerRegistration.assetStoreDirectory.path!) == false {
                try NSFileManager.defaultManager().createDirectoryAtPath(ServiceWorkerRegistration.assetStoreDirectory.path!, withIntermediateDirectories: true, attributes: nil)
            }
            
            
            try r!.data!.writeToFile(destPath.path!, options: NSDataWritingOptions.DataWritingFileProtectionNone)
            let attachment = try UNNotificationAttachment(identifier: "icon", URL: destPath, options: [
                UNNotificationAttachmentOptionsThumbnailClippingRectKey: CGRectCreateDictionaryRepresentation(CGRect(x:0, y: 0, width: 1, height: 1))
            ])
            content.attachments.append(attachment)
            
            return Promise<Void>()
        }
    }
    
    func showNotification(title:String, options: [String:AnyObject]) {
        let content = UNMutableNotificationContent()
        content.title = title
        
        if let body = options["body"] as? String {
            content.body = body
        }
        
        content.threadIdentifier = "THREADY"
        
        var categoryIdentifier = "extended-content"
        
        var nativeActions = [UNNotificationAction]()
        
        if let actions = options["actions"] as? [AnyObject] {
            
            // How do we identify categories/tidy up after ourselves?
            
            
            // attempt at deduping. necessary?
            
            
            for action in actions {
                
                let identifier = action["action"] as! String
                let title = action["title"] as! String
                
                let newAction = UNNotificationAction(identifier: identifier, title: title, options: UNNotificationActionOptions.Foreground)
                nativeActions.append(newAction)
//                categoryIdentifier += identifier + "_" + title
            }
            
        }
        
        let category = UNNotificationCategory(identifier: categoryIdentifier, actions: nativeActions, intentIdentifiers: [], options: UNNotificationCategoryOptions())
        
        UNUserNotificationCenter.currentNotificationCenter().setNotificationCategories([category])
        
        content.categoryIdentifier = categoryIdentifier
        
        self.getIcon(options, content: content)
        .then { () -> Void in
            if let image = options["image"] as? String {
                let imageURL = NSURL(string: image, relativeToURL: NSURL(string: self.scope))!
                content.userInfo["image"] = imageURL.absoluteString
                
            }
            
            let data = options["data"]
            
            content.userInfo["originalNotificationOptions"] = options
            content.userInfo["originalTitle"] = title
            content.userInfo["serviceWorkerScope"] = self.worker.scope.absoluteString
            content.userInfo[ServiceWorkerRegistration.WORKER_ID] = self.worker.instanceId
            
//            let id = String(NSDate().timeIntervalSince1970)
            
            
            if ServiceWorkerRegistration.notificationExtensionContentHandler != nil {
                
                // if we're inside a notification extension, replace the existing notification
                // content.
                NSLog("send notification through content handler")
                ServiceWorkerRegistration.notificationExtensionContentHandler!(content)
                ServiceWorkerRegistration.notificationExtensionContentHandler = nil
            } else {
                
                // Otherwise, we use the normal local notification functions.
                
                let request = UNNotificationRequest(identifier: "test", content: content, trigger: nil)
                
                UNUserNotificationCenter.currentNotificationCenter().addNotificationRequest(request) { (err) in
                    NSLog(String(err))
                }
            }
            
            
            

        }
        .error { err in
            log.error(String(err))
        }
        
       
    
    }
}
