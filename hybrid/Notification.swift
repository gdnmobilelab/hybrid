//
//  Notification.swift
//  hybrid
//
//  Created by alastair.coote on 08/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol NotificationExports: JSExport {
    var title: String {get set}
    var actions: [AnyObject]? {get set}
    var body:String? {get set}
    var data: AnyObject? {get set}
    var tag: String? {get set}
    var icon: String? {get set}
    var image: AnyObject? {get set}
    var video: NotificationVideo? {get}
    var canvas: OffscreenCanvas? {get}
    
    func close()
    
}

@objc class Notification : NSObject, NotificationExports {
    var actions: [AnyObject]? = nil
    var body:String? = nil
    var data:AnyObject? = nil
    var tag:String? = nil
    var icon:String? = nil
    var image: AnyObject? = nil
    var title:String
    var video: NotificationVideo?
    var canvas: OffscreenCanvas?
    
    
    /// We don't store a reference to the worker itself because it could have been updated
    /// in the mean time. We always want the latest instance.
    var belongsToWorkerURL:URL
    
    init(title:String, notificationData: AnyObject? = nil, belongsToWorkerURL:URL) {
        self.title = title
        self.belongsToWorkerURL = belongsToWorkerURL
        
        if let data = notificationData as? [String: AnyObject] {
            self.body = data["body"] as? String
            self.tag = data["tag"] as? String
            self.actions = data["actions"] as? [AnyObject]
            self.icon = data["icon"] as? String
            self.image = data["image"]
            self.data = data["data"]
        }
        
        
    }
    
    var closeState = false
    
    func close() {
        self.closeState = true
    }
    
    static func fromNotificationShow(_ notificationShow: PendingNotificationShow, canvas:OffscreenCanvas? = nil, videoView:NotificationVideo? = nil) -> Notification {
        
        let notification = Notification(title: notificationShow.title, notificationData: notificationShow.options as AnyObject?, belongsToWorkerURL: notificationShow.workerURL as URL)
        
        notification.video = videoView
        notification.canvas = canvas
        
        return notification
        
    }

}

@objc protocol NotificationEventExports : JSExport {
    var notification: Notification {get}
    var action: String {get}
}

@objc class NotificationEvent: ExtendableEvent, NotificationEventExports {
    let notification: Notification
    let action: String
    
    init(type: String, notification:Notification, action:String = "") {
        self.notification = notification
        self.action = action
        super.init(type: type)
    }
    
    required init(type: String) {
        fatalError("init(type:) has not been implemented")
    }
}
