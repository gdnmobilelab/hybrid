//
//  ImageView.swift
//  hybrid
//
//  Created by alastair.coote on 15/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import UserNotifications

class ImageView : UIImageView {
    
    init(width: CGFloat, url:String, worker: ServiceWorkerInstance, attachments: [UNNotificationAttachment]) {
        
        let imageURL = URL(string:url, relativeTo: worker.url as URL?)!
        
        log.info("Loading notification image from " + imageURL.absoluteString)
        
        let localURL = attachments.filter { $0.identifier == imageURL.absoluteString}.first?.url
        
        let imgData:Data
        
        if localURL != nil && localURL!.startAccessingSecurityScopedResource() {
            
            imgData = try! Data(contentsOf: localURL!)
            
            localURL!.stopAccessingSecurityScopedResource()
            
        } else {
            
            log.error("Loading cached version of image failed, going to remote")
            
            // precaching could have failed. This will tie up the main thread so it's not great.
            // TODO: async then resize the view afterwards?
            
            imgData = try! Data(contentsOf: imageURL)
            
        }
        
        let img = UIImage(data: imgData)
        super.init(image: img)
        
        let proportion = img!.size.width / width
        self.frame = CGRect(x: 0, y: 0, width: width, height: img!.size.height / proportion)
        
        self.contentMode = UIViewContentMode.scaleAspectFit
    }
    
    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
}
