//
//  Notification.swift
//  hybrid
//
//  Created by alastair.coote on 08/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import UserNotifications

@objc protocol NotificationExports: JSExport {
    var title: String {get set}
    var actions: [Any]? {get set}
    var body:String? {get set}
    var data: Any? {get set}
    var tag: String? {get set}
    var icon: String? {get set}
    var image: Any? {get set}
    var video: NotificationVideo? {get}
    var canvas: OffscreenCanvas? {get}
    var collapsed: [String: Any]? {get}
    func close()
    
}

@objc class Notification : NSObject, NotificationExports {
    var actions: [Any]? = nil
    var body:String? = nil
    var data:Any? = nil
    var tag:String? = nil
    var icon:String? = nil
    var image: Any? = nil
    var title:String
    var video: NotificationVideo?
    var canvas: OffscreenCanvas?
    var pushID:String
    
    //show different text in collapsed view vs expanded
    var collapsed: [String: Any]?
    
    
    /// We don't store a reference to the worker itself because it could have been updated
    /// in the mean time. We always want the latest instance.
    var belongsToWorkerURL:URL
    
    init(title:String, notificationData: [String:AnyObject]? = nil, belongsToWorkerURL:URL, pushID:String) {
        self.title = title
        self.belongsToWorkerURL = belongsToWorkerURL
        self.pushID = pushID
        
        if let data = notificationData {
            self.body = data["body"] as? String
            self.tag = data["tag"] as? String
            self.actions = data["actions"] as? [AnyObject]
            self.icon = data["icon"] as? String
            self.image = data["image"]
            self.data = data["data"]
            self.collapsed = data["collapsed"] as? [String: Any]
        }
        
        
    }
    
    var closeState = false
    
    func close() {
        self.closeState = true
        UNUserNotificationCenter.current().removeDeliveredNotifications(withIdentifiers: [self.pushID])
    }
    
    static func fromNotificationShow(_ notificationShow: PendingNotificationShow, canvas:OffscreenCanvas? = nil, videoView:NotificationVideo? = nil) -> Notification {
        
        let notification = Notification(title: notificationShow.title, notificationData: notificationShow.options as [String:AnyObject]?, belongsToWorkerURL: notificationShow.workerURL as URL, pushID: notificationShow.pushID)
        
        notification.video = videoView
        notification.canvas = canvas
        
        
        return notification
        
    }
    
}

@objc protocol NotificationEventExports : JSExport {
    var notification: Notification {get}
    var action: String {get}
    var target: String {get}
}

@objc class NotificationEvent: ExtendableEvent, NotificationEventExports {
    let notification: Notification
    let action: String
    let target: String
    
    init(type: String, notification:Notification, action:String = "", target:String = "") {
        self.notification = notification
        self.action = action
        self.target = target
        super.init(type: type)
    }
    
    
    required init(type: String) {
        fatalError("init(type:) has not been implemented")
    }
}
