//
//  NotificationService.swift
//  notification-extension
//
//  Created by alastair.coote on 20/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import UserNotifications
import PromiseKit
import JavaScriptCore

class NotificationService: UNNotificationServiceExtension {

    var bestAttemptContent: UNMutableNotificationContent?
    var contentHandler: ((UNNotificationContent) -> Void)?
   
    override func didReceiveNotificationRequest(request: UNNotificationRequest, withContentHandler contentHandler: (UNNotificationContent) -> Void) {
        
        self.contentHandler = contentHandler
        
        let workerURL = request.content.userInfo["service_worker_url"] as! String
        var payload = request.content.userInfo["payload"] as! String
//        var hasShownNotification = false
        
        Promise<Void>()
        .then { () -> Promise<Bool> in
            
            let payloadJSON = try NSJSONSerialization.JSONObjectWithData(payload.dataUsingEncoding(NSUTF8StringEncoding)!, options: [])
            
            if let payloadAsArray = payloadJSON as? [AnyObject] {
                
                // This is kind of a cheat, but our notification-commands library contains code to show a web notification based on
                // the JSON payload passed through. We can't run the service worker inside the notification extension as it
                // immediately hits the memory limit, so instead we try to parse out a notification show command in the JSON.
                
                // None of this adheres to any kind of service worker standard, though.
                
                let firstShowNotificationCommand = payloadAsArray.filter { obj in
                    return obj["command"] as? String == "notification.show"
                }.first
                
                if firstShowNotificationCommand != nil {
                    return self.parseOutNotificationShow(firstShowNotificationCommand!, workerURL: workerURL)
                    .then { notificationContent -> Promise<Bool> in
                        if notificationContent != nil {
                            
                            // If we successfully parsed the notification show command, then show that content
                            contentHandler(notificationContent!)
//                            hasShownNotification = true
                            
                            // Then also remove the command from the list we will eventually pass to our worker
                            let withoutShowCommand = payloadAsArray.filter { command in
                                return firstShowNotificationCommand!.isEqual(command) == false
                            }
                            
                            // Then recreate the JSON so that we can save it
                            payload = try String(data: NSJSONSerialization.dataWithJSONObject(withoutShowCommand, options: []), encoding: NSUTF8StringEncoding)!
                            return Promise<Bool>(true)
                        } else {
                            // For some reason extracting it failed, so show original
                            return Promise<Bool>(false)
                        }
                    }
                }
                
                
            }
            
            return Promise<Bool>(false)
            
        }
        .then { hasShownNotification -> Void in
            if hasShownNotification == false {
                contentHandler(request.content)
            }
            
            // Now save the push event payload, to be used by the content extension or the app itself
            PushEventStore.add(StoredPushEvent(serviceWorkerScope: workerURL, payload: payload, date: NSDate()))
        }
        
        .recover { err in
            NSLog("Failed to parse payload notification: " + String(err))
        }


        
    }
    

    func parseOutNotificationShow(showNotificationCommand:AnyObject, workerURL:String) -> Promise<UNNotificationContent?> {
        
        let notificationCommandPayload = NSMutableDictionary(dictionary: showNotificationCommand["options"] as! NSDictionary)
        
        var options = NSMutableDictionary(dictionary: notificationCommandPayload["options"] as! NSDictionary)
//        var actions = options["actions"] as? [AnyObject]
        
        
        if let actionCommands = notificationCommandPayload["actionCommands"] as? [AnyObject] {
            // Have to remap awful JS here. Need a better fix.
            
            var data = NSMutableDictionary()
            var actions:[AnyObject] = []
            
            if let existingData = options["data"] as? NSDictionary {
                data = NSMutableDictionary(dictionary: existingData)
            }
            
            var commandSequences:[AnyObject] = []
            var commandToActionLabelMap:[AnyObject] = []
            
            actionCommands.forEach { action in
                commandSequences.append(action["commands"]!!)
                let commandString = "__command::" + String(commandSequences.count - 1)
                
                var template = NSMutableDictionary(dictionary: action["template"] as! NSDictionary)
                template["action"] = commandString
                
                actions.append(template)
                
                let actionID = action["actionID"] as? String
                
                commandToActionLabelMap.append((template["title"] as! String) + (actionID != nil ? actionID! : ""))
                
            }

            data["commandSequences"] = commandSequences
            data["commandToActionLabelMap"] = commandToActionLabelMap
            
            options["data"] = data
            options["actions"] = actions
            
            NSLog("argh")
        }

        notificationCommandPayload["options"] = options
        
        do {
            let backToJSON = try NSJSONSerialization.dataWithJSONObject(notificationCommandPayload, options: [])
            NSLog(String(data:backToJSON, encoding: NSUTF8StringEncoding)!)
        } catch {
            NSLog(String(error))
        }
        
        return PayloadToNotificationContent.Convert(notificationCommandPayload, serviceWorkerScope: workerURL)
            .then { content in
                return Promise<UNNotificationContent?>(content)
        }
    
    }

   
    
    override func serviceExtensionTimeWillExpire() {
        // Called just before the extension will be terminated by the system.
        // Use this as an opportunity to deliver your "best attempt" at modified content, otherwise the original push payload will be used.
//        if let contentHandler = contentHandler, let bestAttemptContent =  bestAttemptContent {
//            contentHandler(bestAttemptContent)
//        }
        
        NSLog("will expire")
    }

}
