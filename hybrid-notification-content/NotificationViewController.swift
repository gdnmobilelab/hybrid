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
    
    func fetchURLFromWorker(worker:ServiceWorkerInstance, url:String) -> Promise<NSData?> {
        let request = FetchRequest(url: url, options: nil)
        return worker.dispatchFetchEvent(request)
        .then { response in
            return response?.data
        }
    }
    
    func checkForImage(attachments: [UNNotificationAttachment], worker: ServiceWorkerInstance) {
        let image = attachments.filter { attachment in
            return attachment.identifier == "image"
            }.first
        
        if image != nil && image!.URL.startAccessingSecurityScopedResource() {
            
            let imgData = NSData(contentsOfURL: image!.URL)!
            
            let img = UIImage(data: imgData)
            
            let imageView = UIImageView(image: img)
            imageView.contentMode = UIViewContentMode.ScaleAspectFit
            
            let proportion = img!.size.width / self.view.frame.width
          
//            imageView.widthAnchor.constraintEqualToAnchor(self.view.widthAnchor, multiplier: 1)
//            imageView.heightAnchor.constraintEqualToAnchor(imageView.widthAnchor, multiplier: proportion)
            self.setFrame(imageView, height: img!.size.height / proportion)
            self.notificationViews.append(imageView)
            
            
            image!.URL.stopAccessingSecurityScopedResource()
            
        }

    }
    
    func checkForCanvas(userInfo:AnyObject, worker: ServiceWorkerInstance) {
        
        let options = userInfo["originalNotificationOptions"]!!
        
        
        var hasCanvas = false
        
        if let specifiedValue = options["canvas"] as? Bool {
            hasCanvas = specifiedValue
        }
        
        if hasCanvas == false {
            return
        }
        
        var ratio:Float = 1.0
        if let specifiedRatio = options["canvasRatio"] as? Float {
            ratio = specifiedRatio
        }
        
        let canvasView = CanvasView(width: Int(self.view.frame.width), ratio: ratio, worker: worker)
        setFrame(canvasView)
        self.notificationViews.append(canvasView)
    }

    var activeVideo:NotificationVideo?
    
    func checkForVideo(attachments: [UNNotificationAttachment], options: AnyObject, worker: ServiceWorkerInstance) {
        
        let video = attachments.filter { attachment in
            return attachment.identifier == "video"
            }.first
        
        if video == nil {
            return
        }
        
        let videoURL = video!.URL
        
        videoURL.startAccessingSecurityScopedResource()
        
        let videoOptions = options["video"]!!
        
        var videoProportion = videoOptions["proportion"] as? CGFloat
        
        if videoProportion == nil {
            videoProportion = 16 / 10
        }
        
        let videoNotification = NotificationVideo(videoURL: videoURL, options: videoOptions, context: self.extensionContext)
        
        videoNotification.playerController.view.autoresizingMask = UIViewAutoresizing.None
        self.setFrame(videoNotification.playerController.view, height: self.view.frame.width * videoProportion!)
        self.notificationViews.append(videoNotification.playerController.view)
        
        self.activeVideo = videoNotification
        
    }
    
    private func setFrame(view:UIView, height:CGFloat? = nil) {
        let left = self.view.frame.minX
        var top = self.view.frame.minY
        
        if let lastView = self.notificationViews.last {
            top = lastView.frame.maxY
        }
        
        view.frame = CGRect(x: left, y: top, width: self.view.frame.width, height: height != nil ? height! : view.frame.height)
    }
    
    func recreateOriginalText(notification: UNNotification) -> Promise<Void> {
        
        let textContainer = UIView(frame:CGRect(x:0,y:0,width: self.view.frame.width, height: 0))
        
        var targetWidth = textContainer.frame.width - 30
        
        let icon = notification.request.content.attachments.filter { attachment in
            return attachment.identifier == "icon"
        }.first
        
//        UNUserNotificationCenter.currentNotificationCenter()
       
        if icon != nil && icon!.URL.startAccessingSecurityScopedResource() {
            
            targetWidth = targetWidth - 90
            
            let imgData = NSData(contentsOfURL: icon!.URL)!
            
            let img = UIImage(data: imgData)
            
            let imgView = UIImageView(image: img)
            imgView.contentMode = UIViewContentMode.ScaleAspectFit
            imgView.frame = CGRect(x: textContainer.frame.width - 75, y: 15, width: 60, height: 60)
            textContainer.addSubview(imgView)

            
            icon!.URL.stopAccessingSecurityScopedResource()

        }
        
        
        let title = UILabel()
        title.text = notification.request.content.title
        
        title.frame.size.width = targetWidth
        title.frame.origin.x = 15
        title.frame.origin.y = 15
        title.lineBreakMode = NSLineBreakMode.ByWordWrapping
        title.numberOfLines = 0
        
        let desc = title.font.fontDescriptor().fontDescriptorWithSymbolicTraits(UIFontDescriptorSymbolicTraits.TraitBold)
        title.font = UIFont(descriptor: desc!, size: UIFont.labelFontSize())
        title.sizeToFit()
//        self.setFrame(title)
//        self.notificationViews.append(title)
        
        let body = UILabel()
        body.text = notification.request.content.body
        body.frame.size.width = targetWidth
        body.frame.origin.x = title.frame.origin.x
        body.lineBreakMode = NSLineBreakMode.ByWordWrapping
        body.numberOfLines = 0
        body.textColor = UIColor(hue: 51 / 255, saturation: 51 / 255, brightness: 51 / 255, alpha: 1)
        body.sizeToFit()
        body.frame.origin.y = title.frame.height + 15
        
//        self.setFrame(body)
//        self.notificationViews.append(body)
        
        textContainer.addSubview(title)
        textContainer.addSubview(body)
        textContainer.frame.size.height = body.frame.maxY + 15

        self.setFrame(textContainer)
        self.notificationViews.append(textContainer)
        return Promise<Void>()
        
    }
    
    
    

    func didReceiveNotification(notification: UNNotification) {
        
//        self.extensionContext!.cancelRequestWithError(NSError(domain: "test", code: 1, userInfo: nil))
        
        
        // iOS doesn't update userInfo when we push more than one notification
        // sequentially. So we need to keep our own record of the latest.
        latestUserInfo = notification.request.content.userInfo
        
        let scope = notification.request.content.userInfo["serviceWorkerScope"] as! String
        let options = notification.request.content.userInfo["originalNotificationOptions"]!
        
        do {
            // We don't run inside the app, so we need to make our DB instance
            try Db.createMainDatabase()
            
            // Clean up any previous stuff
            
            self.notificationViews.forEach { view in
                view.removeFromSuperview()
            }
            
            self.notificationViews.removeAll()
            
        
            ServiceWorkerManager.getServiceWorkerForURL(NSURL(string: scope)!)
            .then { sw -> Promise<Void> in
                self.checkForCanvas(notification.request.content.userInfo, worker: sw!)
                self.checkForImage(notification.request.content.attachments, worker: sw!)
                self.checkForVideo(notification.request.content.attachments, options: options, worker: sw!)
                return self.recreateOriginalText(notification)
            }
            
            .then { _ -> Void in
                
                self.notificationViews.forEach { view in
                    self.view.addSubview(view)
                }
                
                if self.notificationViews.count > 0 {
                    UIView.animateWithDuration(0.2) {
                        self.preferredContentSize = CGSize(width: 0, height: self.notificationViews.last!.frame.maxY)
                    }
                }
                
            }
        } catch {
            log.error("Notification show failed:" + String(error))
        }
        
    }
    
    
    
    func didReceiveNotificationResponse(response: UNNotificationResponse, completionHandler completion: (UNNotificationContentExtensionResponseOption) -> Void) {
        
        if response.actionIdentifier == UNNotificationDismissActionIdentifier {
            if self.activeVideo != nil {
                // Video somehow keeps playing if we don't do this
                self.activeVideo!.pause()
            }
        }
        
        
        NotificationHandler.processAction(response, userInfo: latestUserInfo!, activeViews: ActiveNotificationViews(video: self.activeVideo))
        .then { _ -> Void in
            
            if PendingNotificationActions.closeNotification == true {
                //PendingNotificationActions.reset()
                
                let allPending = PendingWebviewActions.getAll()
                let actionsThatBringAppToFront = allPending.filter { event in
                    return event.type == WebviewClientEventType.OpenWindow || event.type == WebviewClientEventType.Focus
                }
                
                
                
                if actionsThatBringAppToFront.count > 0 {
                    
                    let openOptions = actionsThatBringAppToFront.first!.options?["openOptions"]!
                    
                    if openOptions != nil && openOptions!["external"] as? Bool == true {
                        
                        let url = NSURL(string: actionsThatBringAppToFront.first!.options!["urlToOpen"] as! String)!
                        
                        self.extensionContext!.openURL(url, completionHandler: { (success) in
                            PendingWebviewActions.removeAtIndex(allPending.indexOf(actionsThatBringAppToFront.first!)!)
                        })
                        completion(UNNotificationContentExtensionResponseOption.Dismiss)
                    } else {
                        completion(UNNotificationContentExtensionResponseOption.DismissAndForwardAction)
                    }
                    
                    
                } else {
                    completion(UNNotificationContentExtensionResponseOption.Dismiss)
                }
                
                
            } else {
                completion(UNNotificationContentExtensionResponseOption.DoNotDismiss)
            }
            
        }
        
        
//        UNUserNotificationCenter.currentNotificationCenter().removeDeliveredNotificationsWithIdentifiers([response.notification.request.identifier])
    }
}
