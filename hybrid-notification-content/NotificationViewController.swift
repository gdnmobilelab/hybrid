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

@objc(NotificationViewController)

class NotificationViewController: UIViewController, UNNotificationContentExtension {

    var notificationViews = [UIView]()
    
    override func viewDidLoad() {
        super.viewDidLoad()

    }
    
    func fetchURLFromWorker(worker:ServiceWorkerInstance, url:String) -> Promise<NSData?> {
        let request = FetchRequest(url: url, options: nil)
        return worker.dispatchFetchEvent(request)
        .then { response in
            return response?.data
        }
    }
    
    func checkForImage(userInfo: AnyObject, worker: ServiceWorkerInstance) -> Promise<Void> {
        let imageURL = userInfo["image"] as? String
        
        if imageURL == nil {
            return Promise<Void>()
        }
        
        return self.fetchURLFromWorker(worker, url: imageURL!)
        .then { data -> Void in
            let img = UIImage(data: data!, scale: UIScreen.mainScreen().scale)
            let imageView = UIImageView(image: img)
            imageView.contentMode = UIViewContentMode.ScaleAspectFit
            
            let proportion = imageView.frame.width / self.view.frame.width
            
            imageView.widthAnchor.constraintEqualToAnchor(self.view.widthAnchor, multiplier: 1)
            imageView.heightAnchor.constraintEqualToAnchor(imageView.widthAnchor, multiplier: proportion)
            self.setFrame(imageView)
            self.notificationViews.append(imageView)
            
            
            
        }

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
        
        let icon = notification.request.content.userInfo["originalNotificationOptions"]?["icon"] as? String
        
        UNUserNotificationCenter.currentNotificationCenter()
       
        if icon != nil {
            
            
            if notification.request.content.attachments.first!.URL.startAccessingSecurityScopedResource() {
                targetWidth = targetWidth - 90
                let img = UIImage(contentsOfFile: notification.request.content.attachments.first!.URL.path!)
                notification.request.content.attachments.first!.URL.stopAccessingSecurityScopedResource()
                
                let imgView = UIImageView(image: img)
                imgView.backgroundColor = UIColor.blueColor()
                imgView.contentMode = UIViewContentMode.ScaleAspectFit
                imgView.frame = CGRect(x: textContainer.frame.width - 75, y: 15, width: 60, height: 60)
                textContainer.addSubview(imgView)

            }
            
            
          
  
        }
        
        
        let title = UILabel()
        title.text = notification.request.content.title
        title.frame.size.width = targetWidth
        title.frame.origin.x = 15
        title.frame.origin.y = 15
        let desc = title.font.fontDescriptor().fontDescriptorWithSymbolicTraits(UIFontDescriptorSymbolicTraits.TraitBold)
        title.font = UIFont(descriptor: desc!, size: 0)
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
        let workerID = notification.request.content.userInfo[ServiceWorkerRegistration.WORKER_ID] as! Int
        
        do {
            // We don't run inside the app, so we need to make our DB instance
            try Db.createMainDatabase()
            
            ServiceWorkerInstance.getById(workerID)
            .then { sw in
                return self.checkForImage(notification.request.content.userInfo, worker: sw!)
                .then { _ in
                    return self.recreateOriginalText(notification)
                }
                
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
        NotificationDelegate.processAction(response)
        .then { _ -> Void in
            
            if PendingNotificationActions.closeNotification == true && PendingNotificationActions.urlToOpen == nil {
                PendingNotificationActions.reset()
                completion(UNNotificationContentExtensionResponseOption.Dismiss)
            } else if PendingNotificationActions.closeNotification == true {
                completion(UNNotificationContentExtensionResponseOption.DismissAndForwardAction)
            } else {
                completion(UNNotificationContentExtensionResponseOption.DoNotDismiss)
            }
            
        }
        
        
//        UNUserNotificationCenter.currentNotificationCenter().removeDeliveredNotificationsWithIdentifiers([response.notification.request.identifier])
    }
}
