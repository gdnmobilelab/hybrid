//
//  NotificationService.swift
//  NotificationServiceTesterService
//
//  Created by alastair.coote on 16/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import UserNotifications
//import ServiceWorker
import Shared
import JavaScriptCore

//class ServiceWorkerRegistrationPlaceholder : ServiceWorkerRegistrationProtocol {
//    func showNotification(title: String) {
//        NSLog("Tried to show notification in placeholder registration")
//    }
//}

class NotificationService: UNNotificationServiceExtension {

    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    static let vm = JSVirtualMachine()
    
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
//        ServiceWorker.virtualMachine = NotificationService.vm
        
        
        
        if let bestAttemptContent = bestAttemptContent {
            
            let size = Int(bestAttemptContent.body)!
            
//            DispatchQueue.global(qos: .background).async {
            
//                autoreleasepool {
//                    try autoreleasepool {
//                        var sw:ServiceWorker? = ServiceWorker(id: "TEST", url: URL(string:"https://www.example.com")!, registration: ServiceWorkerRegistrationPlaceholder())
                    var jsC = JSContext(virtualMachine: NotificationService.vm)
                    
                        
                    let worked = jsC!.evaluateScript("var size = \(size);" + """
                            var array = new Uint8Array(size * 1024);
                            for (let i = 0;i<size * 1024;i++) {
                                array[i] = 1
                            };
                            true
                        """)!.toBool()
                        //                sleep(UInt32(size))
                        //                let worked = true
                        
                        if worked {
                            bestAttemptContent.title = "SUCCESS"
                        } else {
                            bestAttemptContent.title = "HUH?"
                        }
//                    sw!.executionEnvironment.shutdown()
//                        sw = nil
//                    }
                     jsC = nil
                    
                    
                    
                    
//                }
//                DispatchQueue.main.async {
           contentHandler(bestAttemptContent)
            
            
                    fatalError()
//                }
                
//            }
                
            
//            fatalError()
        }
    }
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
            bestAttemptContent.title = "TIMEOUT"
            contentHandler(bestAttemptContent)
        }
    }

}
