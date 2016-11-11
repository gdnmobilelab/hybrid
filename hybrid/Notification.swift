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
    var video: NotificationVideo? {get set}
    
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
    
    init(title:String) {
        self.title = title
    }
    
    func close() {
        PendingNotificationActions.closeNotification = true
    }
}

@objc protocol NotificationEventExports : JSExport {
    var notification: Notification {get}
    var action: String? {get}
}

@objc class NotificationEvent: ExtendableEvent, NotificationEventExports {
    let notification: Notification
    let action: String?
    
    init(type: String, notification:Notification, action:String? = nil) {
        self.notification = notification
        self.action = action
        super.init(type: type)
    }
    
    required init(type: String) {
        fatalError("init(type:) has not been implemented")
    }
}
