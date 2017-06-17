//
//  AppDelegate.swift
//  NotificationServiceTester
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import UIKit
import Just
import UserNotifications
import JavaScriptCore

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate {

    var window: UIWindow?
    var deviceID:String?
    
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler(UNNotificationPresentationOptions.badge)
        let success = notification.request.content.title == "SUCCESS"
        if success == false {
           ViewController.textView!.text = notification.request.content.title + " at " + notification.request.content.body
        } else {
            let lastAmt = Int(notification.request.content.body)!
            ViewController.textView!.text = "Success at " + String(lastAmt)
//            sleep(2000)
            if lastAmt < 10000 {
                NSLog("Trying " + String(lastAmt + 500))
                 self.sendNotification(title: "FAILURE", body: String(lastAmt + 500))
                NSLog("sent?")
            }
        }
        
        NSLog("will?" + notification.request.content.title)
        
    }
    
    func sendNotification(title:String, body: String) {
        Just.post("https://alastairtest-node.ngrok.io/registrations/" + self.deviceID!, json: [
            "ttl": 500,
            "payload": ["hello": "yes"],
            "service_worker_url": "test",
            "priority": "high",
            "ios": [
                "title": title,
                "body": body
            ]
        ]) { r in
            NSLog("Sent OK? " + String(r.ok))
            
        }
            
    }

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        return true
    }
    
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        NSLog("WOOOOOO")
        
        UNUserNotificationCenter.current().delegate = self
        
        var token: String = ""
        for i in 0..<deviceToken.count {
            token += String(format: "%02.2hhx", deviceToken[i] as CVarArg)
        }
        
        let subToken:[String:Any] = [
            "platform": "iOS",
            "device_id": token,
            "bundle_name": "com.gdnmobilelabaccount.NotificationServiceTester",
            "sandbox": true
        ]
        
        Just.post("https://alastairtest-node.ngrok.io/registrations",
                  json: ["subscription": subToken],
                  headers: [
                    "Authorization": "USER_KEY"
                   ]
        ) { r in
            let id = (r.json as AnyObject)["id"] as! String
            
            self.deviceID = id
            self.sendNotification(title: "FAILED", body: "1")
        }
        
    }
    
    func application(_ application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: Error) {
        fatalError("Could not get remote notifications. Are you running in the simulator?")
    }
    
    

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }


}

