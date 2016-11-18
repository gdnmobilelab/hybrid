//
//  AppDelegate.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import UIKit
import PromiseKit
import EmitterKit
import UserNotifications
import GCDWebServer

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    static var window: UIWindow?
    static var rootController:HybridNavigationController?
    
    func application(application: UIApplication, willFinishLaunchingWithOptions launchOptions: [NSObject : AnyObject]?) -> Bool {
        UNUserNotificationCenter.currentNotificationCenter().delegate = NotificationDelegateInstance
        return true
    }
    
    static var runningInTests:Bool {
        get {
            return NSClassFromString("XCTest") != nil
        }
    }
    
    func application(application: UIApplication, didFinishLaunchingWithOptions launchOptions: [NSObject: AnyObject]?) -> Bool {
        
        log.setup(.Debug, showLogIdentifier: false, showFunctionName: false, showThreadName: true, showLogLevel: true, showFileNames: false, showLineNumbers: false, showDate: false, writeToFile: nil, fileLogLevel: nil)
        
        do {
            
            GCDWebServer.setLogLevel(2)
            
            try Db.createMainDatabase()
            try DbMigrate.migrate()
            
            PushManager.listenForDeviceToken()
            
            // This should be reset anyway (it's done on terminate) but if a user force-closes then it won't be.
            // So let's make doubly-sure.
            
            WebviewClientManager.resetActiveWebviewRecords()
            
            application.registerForRemoteNotifications()
            

            AppDelegate.window = UIWindow(frame: UIScreen.mainScreen().bounds)
            
            let rootController = HybridNavigationController.create()
            
            #if IS_DEBUG

            if AppDelegate.runningInTests == false {
//                // todo: remove
//                ServiceWorkerManager.clearActiveServiceWorkers()
//                try Db.mainDatabase.inDatabase({ (db) in
//                    db.executeUpdate("DELETE FROM service_workers", withArgumentsInArray: nil)
//                    db.executeUpdate("DELETE FROM cache", withArgumentsInArray: nil)
//                })

            }
                
            #endif
            
            let windowOpenActions = PendingWebviewActions.getAll().filter { event in
                return event.type == WebviewClientEventType.OpenWindow
            }
            
            if windowOpenActions.count == 0 {
                
                #if IS_DEBUG
                    rootController.pushNewHybridWebViewControllerFor(NSURL(string:"http://www.gdnmobilelab.local:4567/app-demo/")!)
//                    rootController.pushNewHybridWebViewControllerFor(NSURL(string:"https://www.gdnmobilelab.com/app-demo/")!)
                #else
                    rootController.pushNewHybridWebViewControllerFor(NSURL(string:"https://www.gdnmobilelab.com/app-demo/")!)
                #endif
                
            }
            
            
            AppDelegate.rootController = rootController
        
            AppDelegate.window!.rootViewController = rootController
            
            AppDelegate.window!.makeKeyAndVisible();
            
            log.info("App is running.")
            
            return true
            
            

        } catch {
            print(error);
            return false;
        }
        
    }
    
//    func application(application: UIApplication, didReceiveRemoteNotification userInfo: [NSObject : AnyObject], fetchCompletionHandler completionHandler: (UIBackgroundFetchResult) -> Void) {
//        NSLog("HIT DID RECEIVE THING")
//        completionHandler(UIBackgroundFetchResult.NewData)
//    }
    


    func application(application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: NSData) {
        ApplicationEvents.emit("didRegisterForRemoteNotificationsWithDeviceToken", deviceToken)
    }
    
    func application(application: UIApplication, didFailToRegisterForRemoteNotificationsWithError error: NSError) {
        ApplicationEvents.emit("didFailToRegisterForRemoteNotificationsWithError", error)
    }
    
    func applicationWillResignActive(application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    }
    
    
    
    func applicationDidEnterBackground(application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
        log.info("App is entering background mode")
        WebServerDomainManager.stopAll()
    }
    
    func applicationWillEnterForeground(application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
        log.info("App is being reactivated into foreground mode.")
        
        do {
            try WebServerDomainManager.startAll()
        }
        catch {
            log.error("Could not restart servers:" + String(error))
        }
    }
    
    func applicationDidBecomeActive(application: UIApplication) {
        
        
        let numPendingActions = PendingWebviewActions.getAll().count
        
        log.info("App became active with " + String(numPendingActions) + " pending actions")
        
        // There's a chance that some push events have arrived while the app has been inactive. So let's make sure
        // all of our active workers are up to date.
        
        ServiceWorkerManager.currentlyActiveServiceWorkers.forEach { (workerID, worker) in
            worker.processPendingPushEvents()
        }
        
    }
    
    func applicationWillTerminate(application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
//        WebServer.current!.stop()
        NSLog("Did Terminate")
        
        // We need to clear out the records of active webviews, because they're dead now. And if a notification tries to claim
        // it,
        WebviewClientManager.resetActiveWebviewRecords()
    }
    
    
}

