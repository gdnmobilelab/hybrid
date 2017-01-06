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
import AVKit
import AVFoundation

@objc(NotificationViewController)
class NotificationViewController: UIViewController, UNNotificationContentExtension {

    var notificationViews = [UIView]()
    
    var latestUserInfo:[AnyHashable: Any]? = nil
    
    var notificationShowData:PendingNotificationShow?
    var notificationInstance:Notification?
    var currentVideoView:VideoView?
    var currentCanvasView:CanvasView?
    var interactiveViewContainer = UIView()
    
    static var webviewEventListener:Listener<PendingWebviewAction>?
    
    
    override func viewDidLoad() {
        SharedResources.currentExecutionEnvironment = SharedResources.ExecutionEnvironment.notificationContentExtension
        super.viewDidLoad()
        
        if NotificationViewController.webviewEventListener == nil {
            
            // Add our listener that will save pending webview events to be processed by the
            // app once we've handed off
            
            NotificationViewController.webviewEventListener = WebviewClientManager.clientEvents.on("*", {
                PendingWebviewActions.add($0)
            })
            PendingWebviewActions.removeAll()
        }
        
    }
    
    
    fileprivate func setFrame(_ view:UIView, height:CGFloat? = nil) {
        let left = self.view.frame.minX
        var top = self.view.frame.minY
        
        let indexOfThisOne = self.notificationViews.index(of: view)
        
        if indexOfThisOne! > 0 {
            top = self.notificationViews[indexOfThisOne! - 1].frame.maxY
        }
        
        view.frame = CGRect(x: left, y: top, width: self.view.frame.width, height: height != nil ? height! : view.frame.height)
    }
    
    
    
    func removeAllViews() {
        self.notificationViews.forEach { view in
            view.removeFromSuperview()
        }
        
        self.notificationViews.removeAll()
    }
    

    func didReceive(_ notification: UNNotification) {
        
        // iOS doesn't update userInfo when we push more than one notification
        // sequentially. So we need to keep our own record of the latest.
        latestUserInfo = notification.request.content.userInfo
        
        let attachments = notification.request.content.attachments
        
        // Copy the array to refer to later - we remove views that aren't
        // in our new stack.
        let currentNotificationViews = self.notificationViews.map { $0 }
        self.notificationViews.removeAll()
        
        self.title = "MOBILE LAB"
        
        Promise(value: ())
        .then {
            // We don't run inside the app, so we need to make our DB instance
            try Db.createMainDatabase()
            
            /// Hopefully any pending push events have already been processed by the app. But
            /// if a user has force quit the app it won't be woken up on push, so we need to
            /// catch any unprocessed push events before we do anything else.
            
            let pendingPushEvent = PendingPushEventStore.getByPushID(notification.request.identifier)
    
            if pendingPushEvent == nil {
                return Promise(value: ())
            }
    
            return ServiceWorkerInstance.getActiveWorkerByURL(URL(string: pendingPushEvent!.serviceWorkerURL)!)
            .then { sw in
                // Process all pending events, too complicated otherwise (what if a user opens a later
                // notification followed by an earlier one?)
                return sw!.processPendingPushEvents()
            }
            
        }
        .then {
            self.notificationShowData = PendingNotificationShowStore.getByPushID(notification.request.identifier)
            
            if self.notificationShowData == nil {
                throw ErrorMessage("No notification show data exists for this notification ID")
            }
            
            self.notificationInstance = Notification.fromNotificationShow(self.notificationShowData!)
            
            if let headerText = self.notificationShowData!.options["headerText"] as? String {
                self.title = headerText
            } else {
                self.title = "MOBILE LAB"
            }
            
            return ServiceWorkerInstance.getActiveWorkerByURL(self.notificationInstance!.belongsToWorkerURL)
            .then { sw -> Void in
                
                if sw == nil {
                    throw ErrorMessage("No service worker exists for the specified URL")
                }
                
                if let videoOptions = self.notificationShowData!.options["video"] as? [String:Any] {
                    
                    if self.currentVideoView == nil || self.currentVideoView!.optionsMatch(newOptions: videoOptions, workerURL: sw!.url, attachments: attachments) == false {
                        
                        // If it's the same video, preserve the current view, so we don't lose playback point etc
                        
                        self.currentVideoView = VideoView(width: self.view.frame.width, options: videoOptions, worker: sw!, context: self.extensionContext!, attachments: attachments)
                    }
                    
                    
                    self.notificationInstance!.video = self.currentVideoView?.videoInstance
                    
                    if let view = self.currentVideoView {
                        self.interactiveViewContainer.addSubview(view)
                    }

                } else {
                    self.currentVideoView?.removeFromSuperview()
                    self.currentVideoView = nil
                    self.notificationInstance!.video = nil
                }
                
                if let canvasOptions = self.notificationShowData!.options["canvas"] {
                    
                    var proportion:CGFloat = 1
                    
                    if let canvasProportion = canvasOptions["proportion"] as? CGFloat {
                        proportion = canvasProportion
                    }
                    
                    if self.currentCanvasView == nil || self.currentCanvasView!.proportion != proportion {
                        self.currentCanvasView = CanvasView(width: self.view.frame.width, proportion: proportion, worker: sw!, notification: self.notificationInstance!)

                    }
                    
                    self.notificationInstance!.canvas = self.currentCanvasView?.canvas
                    if let view = self.currentCanvasView {
                        self.interactiveViewContainer.addSubview(view)
                    }
                    
                } else {
                    self.currentCanvasView?.removeFromSuperview()
                    self.currentCanvasView = nil
                    self.notificationInstance!.canvas = nil
                }
                
                if let imageURL = self.notificationShowData!.options["image"] as? String {
                    
                    let imageView = ImageView(width: self.view.frame.width, url: imageURL, worker: sw!, attachments: attachments)
                    
                    self.notificationViews.append(imageView)
                }
                
                if self.interactiveViewContainer.subviews.count > 0 {
                    
                    // Interactive views have to be the same size as each other otherwise it'll look weird
                    
                    let maxFrame = self.interactiveViewContainer.subviews
                        .map { $0.frame }
                        .sorted { $0.height > $1.height }
                        .first!
                    
                    self.interactiveViewContainer.frame = maxFrame
                    self.notificationViews.append(self.interactiveViewContainer)
                }
                
                
                if self.notificationShowData!.options["hideText"] as? Bool != true {
                    
                    let bodyText = self.notificationShowData!.options["body"] as! String
                    let textView = NotificationTextView(title: self.notificationShowData!.title, body: bodyText, frame: self.view.frame)
                    self.notificationViews.append(textView)
                    
                }

                
                // not returning the promise as we don't want to wait for this, just send it
                NotificationHandler.sendExpand(self.notificationInstance!)
                .catch { err in
                    log.error("Error encountered when sending notification expand event:" + String(describing: err))
                }
                
            }
            
            
        }
        .recover { err -> Void in
            log.error("Notification show failed: " + String(describing: err))
            
            // If anything failed we fall back to a single text view that uses the title and body
            // that were hardcoded into the notification request
            
            self.removeAllViews()
            
            let textView = NotificationTextView(title: notification.request.content.title, body: notification.request.content.body, frame: self.view.frame)
            
            self.notificationViews.append(textView)
            
        }
        .then { () -> Void in
            
            currentNotificationViews.forEach { view in
                if self.notificationViews.contains(view) == false {
                    view.removeFromSuperview()
                }
            }
            
            self.notificationViews.forEach { view in
                self.setFrame(view)
                self.view.addSubview(view)
            }
            
            UIView.animate(withDuration: 0.2) {
                self.preferredContentSize = CGSize(width: 0, height: self.notificationViews.last!.frame.maxY)
            }
        }
        .catch { err in
            log.error("Error encountered setting/resizing notification views: " + String(describing: err))
        }
//
        
    }
    
    func sendExpandedNotificationClick() {
        NotificationHandler.sendNotificationEvent(type: "notificationclick", self.notificationInstance!, target: "interactivearea")
        .then { () -> Void in
            
            // in theory at this point we'd look for notification.close, but we can't act on it. Instead, if we have an
            // open action, the close is implied.
            
            let actionThatBringsAppToFront = PendingWebviewActions.getAll().filter { event in
                return event.type == PendingWebviewActionType.openWindow || event.type == PendingWebviewActionType.focus
            }.last
            
            if let action = actionThatBringsAppToFront {
                self.openURLInAppOrExternal(action: action)
            }
            
        }
        .catch { err in
            log.error("Error processing expanded notification click: " + String(describing: err))
        }
    }
    
    func mediaPlay() {
        self.sendExpandedNotificationClick()
    }
    
    func mediaPause() {
        self.sendExpandedNotificationClick()
    }
    
    var mediaPlayPauseButtonTintColor: UIColor {
        get {
            return UIColor(red: 0, green: 0, blue: 0, alpha: 0.0)
        }
    }

    var mediaPlayPauseButtonFrame: CGRect {
        get {
            return self.view.frame
        }
    }
    
    var mediaPlayPauseButtonType:UNNotificationContentExtensionMediaPlayPauseButtonType {
        get {
            return UNNotificationContentExtensionMediaPlayPauseButtonType.default
        }
    }
    
    class NotificationResponseFailedError : Error {}
    
    func didReceive(_ response: UNNotificationResponse, completionHandler completion: @escaping (UNNotificationContentExtensionResponseOption) -> Void) {
        
        
        Promise(value: ())
        .then { () -> Promise<Void> in
            if response.actionIdentifier == UNNotificationDismissActionIdentifier {
                
                if self.notificationInstance!.video != nil {
                    // Video somehow keeps playing if we don't do this
                    self.notificationInstance!.video!.pause()
                }
                
                // don't want the app to also process this event
                NotificationHandler.IgnoreNotificationCloseInMainApp = true
                self.notificationInstance!.closeState = true
                return NotificationHandler.sendNotificationEvent(type: "notificationclose", self.notificationInstance!)
            }
            
            if let clickedActionIndex = Int(response.actionIdentifier) {
                
                let action = self.notificationShowData!.getActions()[clickedActionIndex].identifier
                
                return NotificationHandler.sendAction(action, notification: self.notificationInstance!)
                
            }
            
            throw NotificationResponseFailedError()
        }
        .recover { error -> Void in
            log.error("Error occurred when processing notification response: " + String(describing: error))
            self.notificationInstance!.close()
        }
        .then { () -> Void in
            
            let allPendingActions = PendingWebviewActions.getAll()
            
            // We shouldn't ever really have more than one
            
            let actionThatBringsAppToFront = allPendingActions.filter { event in
                return event.type == PendingWebviewActionType.openWindow || event.type == PendingWebviewActionType.focus
            }.last

            if let action = actionThatBringsAppToFront {
                
                // We would use UNNotificationContentExtensionResponseOption.DismissAndForwardAction
                // to bring the app into focus, but that makes you have to decide between whether a
                // notification can .Dismiss or .DismissAndForwardAction, but not both. Since our buttons
                // are dynamic we don't want that. So we use a URL handler instead.
                
                self.openURLInAppOrExternal(action: action)
                completion(UNNotificationContentExtensionResponseOption.dismiss)
                
            } else if self.notificationInstance!.closeState == true {
                ServiceWorkerManager.clearActiveServiceWorkers()
                completion(UNNotificationContentExtensionResponseOption.dismiss)
            } else {
                completion(UNNotificationContentExtensionResponseOption.doNotDismiss)
            }
            
        }
        .catch { err in
            log.error("Error parsing notification actions: " + String(describing: err))
            completion(UNNotificationContentExtensionResponseOption.dismiss)
        }
    }

    func openURLInAppOrExternal(action:PendingWebviewAction) {
        var url = URL(string: "gdnmobilelab://")!
        
        // using first because we sort of have to, also no-one should ever want to open two windows
        // at once because the browser will only show one
        
        let openOptions = action.options?["openOptions"] as? [String: Any]
        
        if action.type == PendingWebviewActionType.openWindow && openOptions?["external"] as? Bool == true {
            
            // We have the option to open a link "externally", i.e. force it into Safari.
            // if that's enabled we pass the URL directly to the OS, rather than into
            // the app and back out again.
            
            url = URL(string: action.options!["urlToOpen"] as! String)!
            
            PendingWebviewActions.remove(action)
        }
        
        self.extensionContext!.open(url, completionHandler: nil)
        ServiceWorkerManager.clearActiveServiceWorkers()

    }
    
}
