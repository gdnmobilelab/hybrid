//
//  NotificationViewController.swift
//  hybrid-notification-content
//
//  Created by alastair.coote on 02/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import UIKit
import UserNotifications
import UserNotificationsUI
import PromiseKit
import EmitterKit
import AVKit
import AVFoundation

@objc(NotificationViewController)
class NotificationViewController: UIViewController, UNNotificationContentExtension {

    var notificationViews = [UIView]()
    
    var latestUserInfo:[NSObject: AnyObject]? = nil
    
    var notificationShowData:PendingNotificationShow?
    var interactiveViews = ActiveNotificationViews()
    
    static var webviewEventListener:Listener?
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        if NotificationViewController.webviewEventListener == nil {
            
            // Add our listener that will save pending webview events to be processed by the
            // app once we've handed off
            
            NotificationViewController.webviewEventListener = WebviewClientManager.clientEvents.on { event in
                PendingWebviewActions.add(event)
            }
            PendingWebviewActions.clear()
        }
        
    }
    
    
    private func setFrame(view:UIView, height:CGFloat? = nil) {
        let left = self.view.frame.minX
        var top = self.view.frame.minY
        
        let indexOfThisOne = self.notificationViews.indexOf(view)
        
        if indexOfThisOne! > 0 {
            top = self.notificationViews[indexOfThisOne! - 1].frame.maxY
        }
        
        view.frame = CGRect(x: left, y: top, width: self.view.frame.width, height: height != nil ? height! : view.frame.height)
    }
    
    
    
    /// Hopefully any pending push events have already been processed by the app. But
    /// if a user has force quit the app it won't be woken up on push, so we need to
    /// catch any unprocessed push events before we do anything else.
    ///
    /// - Parameter pushID: The identifier of the remote notification
    /// - Returns: A promise that resolves when push events have been processed
    func processPendingPushEvents(pushID:String) -> Promise<Void> {
        let pendingPushEvent = PendingPushEventStore.getByPushID(pushID)
        
        if pendingPushEvent == nil {
            return Promise<Void>()
        }
        
        return ServiceWorkerInstance.getActiveWorkerByURL(NSURL(string: pendingPushEvent!.serviceWorkerURL)!)
        .then { sw in
            // Process all pending events, too complicated otherwise (what if a user opens a later
            // notification followed by an earlier one?)
            return sw!.processPendingPushEvents()
        }
    }
    
    func removeAllViews() {
        self.notificationViews.forEach { view in
            view.removeFromSuperview()
        }
        
        self.notificationViews.removeAll()
    }
    

    func didReceiveNotification(notification: UNNotification) {
        
        // iOS doesn't update userInfo when we push more than one notification
        // sequentially. So we need to keep our own record of the latest.
        latestUserInfo = notification.request.content.userInfo
        
        let attachments = notification.request.content.attachments
        
        Promise<Void>()
        .then {
            // We don't run inside the app, so we need to make our DB instance
            try Db.createMainDatabase()
            
            // If we're loading on top of an existing notification, clear any
            // existing views
            self.removeAllViews()
            
            return self.processPendingPushEvents(notification.request.identifier)
        }
        .then {
            self.notificationShowData = PendingNotificationShowStore.getByPushID(notification.request.identifier)
            
            if self.notificationShowData == nil {
                throw ErrorMessage(msg: "No notification show data exists for this notification ID")
            }
            
            return ServiceWorkerInstance.getActiveWorkerByURL(self.notificationShowData!.workerURL)
            .then { sw -> Void in
                
                if sw == nil {
                    throw ErrorMessage(msg: "No service worker exists for the specified URL")
                }
                
                if let canvasOptions = self.notificationShowData!.options["canvas"] {
                    
                    var proportion:CGFloat = 1
                    if let canvasProportion = canvasOptions["proportion"] as? CGFloat {
                        proportion = canvasProportion
                    }
                    let canvasView = CanvasView(width: self.view.frame.width, ratio: proportion, worker: sw!)
                    self.interactiveViews.canvas = canvasView
                    self.notificationViews.append(canvasView)
                    
                } else if let videoOptions = self.notificationShowData!.options["video"] {
                    
                    let videoView = VideoView(width: self.view.frame.width, options: videoOptions, worker: sw!, context: self.extensionContext!, attachments: attachments)
                    self.interactiveViews.video = videoView.videoInstance
                    self.notificationViews.append(videoView)
                    
                } else if let imageURL = self.notificationShowData!.options["image"] as? String {
                    
                    let imageView = ImageView(width: self.view.frame.width, url: imageURL, worker: sw!, attachments: attachments)
                    
                    self.notificationViews.append(imageView)
                }
                
                
                
                let bodyText = self.notificationShowData!.options["body"] as! String
                
                let textView = NotificationTextView(title: self.notificationShowData!.title, body: bodyText, frame: self.view.frame)
                
                
                self.notificationViews.append(textView)

                
                // not returning the promise as we don't want to wait for this, just send it
                NotificationHandler.sendExpand(self.notificationShowData!)
                
            }
            
            
        }
        .recover { err -> Void in
            log.error("Notification show failed: " + String(err))
            
            // If anything failed we fall back to a single text view that uses the title and body
            // that were hardcoded into the notification request
            
            self.removeAllViews()
            
            let textView = NotificationTextView(title: notification.request.content.title, body: notification.request.content.body, frame: self.view.frame)
            
            self.notificationViews.append(textView)
            
        }
        .then { () -> Void in
            
            self.notificationViews.forEach { view in
                self.setFrame(view)
                self.view.addSubview(view)
            }
            
            UIView.animateWithDuration(0.2) {
                self.preferredContentSize = CGSize(width: 0, height: self.notificationViews.last!.frame.maxY)
            }
        }
        
        
    }
    
    class NotificationResponseFailedError : ErrorType {}
    
    func didReceiveNotificationResponse(response: UNNotificationResponse, completionHandler completion: (UNNotificationContentExtensionResponseOption) -> Void) {
        
        
        Promise<Void>()
        .then { () -> Promise<Void> in
            if response.actionIdentifier == UNNotificationDismissActionIdentifier {
                
                if self.interactiveViews.video != nil {
                    // Video somehow keeps playing if we don't do this
                    self.interactiveViews.video!.pause()
                }
                
                
                // We don't send the close event here because the app handles it internally
                return Promise<Void>()
            }
            
            if let clickedActionIndex = Int(response.actionIdentifier) {
                
                let action = self.notificationShowData!.getActions()[clickedActionIndex].identifier
                
                return NotificationHandler.sendAction(action, notificationShow: self.notificationShowData!, activeViews: self.interactiveViews)
                
            }
            
            throw NotificationResponseFailedError()
        }
        .recover { error -> Void in
            log.error("Error occurred when processing notification response: " + String(error))
            PendingNotificationActions.closeNotification = true
        }
        .then { () -> Void in
            
            let allPendingActions = PendingWebviewActions.getAll()
            
            let actionsThatBringAppToFront = allPendingActions.filter { event in
                return event.type == WebviewClientEventType.OpenWindow || event.type == WebviewClientEventType.Focus
            }

            if actionsThatBringAppToFront.count > 0 {
                
                // We would use UNNotificationContentExtensionResponseOption.DismissAndForwardAction
                // to bring the app into focus, but that makes you have to decide between whether a
                // notification can .Dismiss or .DismissAndForwardAction, but not both. Since our buttons
                // are dynamic we don't want that. So we use a URL handler instead.
                
                var url = NSURL(string: "gdnmobilelab://")!
                
                // using first because we sort of have to, also no-one should ever want to open two windows
                // at once because the browser will only show one
                
                let windowOpen = actionsThatBringAppToFront.filter { $0.type == WebviewClientEventType.OpenWindow}.first
                
                if windowOpen?.options?["openOptions"]?["external"] as? Bool == true {
                    
                    // We have the option to open a link "externally", i.e. force it into Safari.
                    // if that's enabled we pass the URL directly to the OS, rather than into
                    // the app and back out again.
                    
                    url = NSURL(string: windowOpen!.options!["urlToOpen"] as! String)!
                 
                    PendingWebviewActions.removeAtIndex(allPendingActions.indexOf(windowOpen!)!)
                }
        
                self.extensionContext!.openURL(url, completionHandler: nil)
                completion(UNNotificationContentExtensionResponseOption.Dismiss)
                
            } else if PendingNotificationActions.closeNotification == true {
                completion(UNNotificationContentExtensionResponseOption.Dismiss)
            } else {
                completion(UNNotificationContentExtensionResponseOption.DoNotDismiss)
            }
            
//            PendingWebviewActions.clear()
        }

    }
}
