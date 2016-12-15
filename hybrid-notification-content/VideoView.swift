//
//  VideoView.swift
//  hybrid
//
//  Created by alastair.coote on 15/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import UserNotifications

class VideoView : UIView {
    
    let videoInstance:NotificationVideo
    
    init(width: CGFloat, options:AnyObject, worker: ServiceWorkerInstance, context: NSExtensionContext, attachments: [UNNotificationAttachment]) {
        
        var proportion:CGFloat = 16/10
        
        if let proportionOption = options["proportion"] as? CGFloat {
           proportion = proportionOption
        }
        
        var videoURL = NSURL(string: options["url"] as! String, relativeToURL: worker.url)!
        
        
        if options["preload"] as? Bool == true {

            // If we've preloaded our video, we want to use the local URL for the
            // attachment rather than the remote one.

            let video = attachments.filter { $0.identifier == videoURL.absoluteString! }.first
            
            if video != nil && video!.URL.startAccessingSecurityScopedResource() {
                
                // Could still be nil if downloading failed
                videoURL = video!.URL
                
            }
            
            log.info("Loading local notification video from " + videoURL.absoluteString!)

            
        } else {
            log.info("Loading remote notification video from " + videoURL.absoluteString!)
        }
        
        self.videoInstance = NotificationVideo(videoURL: videoURL, options: options, context: context)
        
        super.init(frame:CGRect(x: 0,y: 0,width: width, height: width * proportion))
        videoInstance.playerController.view.frame = self.frame
        self.addSubview(videoInstance.playerController.view)
        
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
}
