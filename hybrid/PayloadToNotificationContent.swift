//
//  PayloadToNotificationContent.swift
//  hybrid
//
//  Created by alastair.coote on 24/10/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UserNotifications
import PromiseKit
import CoreGraphics

class PayloadToNotificationContent {
    
    private static func addAssets(options:AnyObject, content:UNMutableNotificationContent, scope: String) -> Promise<Void> {
        var assetsToFetch: [String] = []
        var hasIcon = false
        var hasImage = false
        
        let scopeURL = NSURL(string:scope)!
        
        if let icon = options["icon"] as? String {
            assetsToFetch.append(icon)
            hasIcon = true
        }
        
        if let image = options["image"] as? String {
            log.info("Found image to attach to notification")
            assetsToFetch.append(image)
            hasImage = true
        }
        
        return when(assetsToFetch.map { requestURL -> Promise<NSURL> in
            
            let sourceURL = NSURL(string: requestURL, relativeToURL: scopeURL)!

            return GlobalFetch.fetchRequest(FetchRequest(url: sourceURL.absoluteString!, options: nil))
            .then { response -> NSURL in
                
                let filename = NSUUID().UUIDString
                let fileURL = NSURL(fileURLWithPath: NSTemporaryDirectory())
                    .URLByAppendingPathComponent(filename)!
                    .URLByAppendingPathExtension(sourceURL.pathExtension!)!
                
                try response.data!.writeToFile(fileURL.path!, options: NSDataWritingOptions.DataWritingAtomic)
                
                return fileURL
                
            }
            
        })
        .then { fileURLs -> Void in
            

            if hasIcon {
                let iconAttachment = try UNNotificationAttachment(
                    identifier: "icon",
                    URL: fileURLs[0],
                    options: [
                        UNNotificationAttachmentOptionsThumbnailClippingRectKey: CGRectCreateDictionaryRepresentation(CGRect(x:0, y: 0, width: 1, height: 1)
                        )
                    ]
                )
                
                content.attachments.append(iconAttachment)
            }
            
            if hasImage {
                let imageURL = hasIcon ? fileURLs[1] : fileURLs[0]
                
                let imageAttachment = try UNNotificationAttachment(
                    identifier: "image",
                    URL: imageURL,
                    options: [
                        UNNotificationAttachmentOptionsThumbnailHiddenKey: true
                    ]
                )
                
                content.attachments.append(imageAttachment)
                
            }
                
                
        }
        .recover { err -> Void in
            log.error("Failed to add assets to notification: " + String(err))
        }

    }
    
    static func clearWithTag(tag:String) {
        UNUserNotificationCenter.currentNotificationCenter().getDeliveredNotificationsWithCompletionHandler { notifications in
            let identifiers = notifications
                .filter { notification in
                    return notification.request.content.threadIdentifier == tag
                }
                .map { notification in
                    return notification.request.identifier
                }
            
            
            UNUserNotificationCenter.currentNotificationCenter().removeDeliveredNotificationsWithIdentifiers(identifiers)
        }
    }
    
    static func Convert(title:String, options:AnyObject, serviceWorkerScope: String) -> Promise<UNNotificationContent> {
        
        let content = UNMutableNotificationContent()
        
        content.title = title
        content.userInfo["originalTitle"] = title
        
        // Make sure we trigger our extended view for notification detail
        content.categoryIdentifier = "extended-content"
        
        if let body = options["body"] as? String {
            content.body = body
        }

        if let tag = options["tag"] as? String {
            content.threadIdentifier = tag
            clearWithTag(tag)
        }
        
        var nativeActions = [UNNotificationAction]()
        
        if let actions = options["actions"] as? [AnyObject] {
            
            for action in actions {
                
                let identifier = action["action"] as! String
                let title = action["title"] as! String
                
                var options: UNNotificationActionOptions = [.Foreground]
                
                
                
                if let willClose = action["willCloseNotification"] as? Bool {
                    
                    // Unfortunately, iOS seems to make us choose between two things - the ability to dismiss
                    // the notification, and the ability to bring the app to the foreground. So we have to pass
                    // an extra flag in our JS when we know an action will dismiss a notification. Far from ideal.
                    
                    if willClose == true {
                        options.remove(.Foreground)
                    }
                }
                
                if let destructive = action["destructive"] as? Bool {
                    
                    // While we're here, add support for the iOS "destructive" action type - colors text in red
                    
                    if destructive == true {
                        options.insert(.Destructive)
                    }
                }
                
                let newAction = UNNotificationAction(identifier: identifier, title: title, options: options)
                nativeActions.append(newAction)
            }
            
            
        }
        
        // This concerns me. Can we really set these here and rely on the fact that they'll carry through to the notification display?
        // [.CustomDismissAction]
        
        let category = UNNotificationCategory(identifier: "extended-content", actions: nativeActions, intentIdentifiers: [], options: UNNotificationCategoryOptions([.CustomDismissAction]))
        
        UNUserNotificationCenter.currentNotificationCenter().setNotificationCategories([category])
        
        content.userInfo["originalNotificationOptions"] = options
        content.userInfo["serviceWorkerScope"] = serviceWorkerScope

        
        
        return addAssets(options, content: content, scope: serviceWorkerScope)
        .then {
            return content
        }
        
        
        
    }
    
}
