//
//  AppDelegate.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import UIKit
import XCGLogger;
import PromiseKit

let log = XCGLogger.defaultInstance()

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    var window: UIWindow?
    
    func application(application: UIApplication, didFinishLaunchingWithOptions launchOptions: [NSObject: AnyObject]?) -> Bool {
        
        
        
        log.setup(.Debug, showLogIdentifier: false, showFunctionName: false, showThreadName: true, showLogLevel: true, showFileNames: false, showLineNumbers: false, showDate: false, writeToFile: nil, fileLogLevel: nil)
        
        do {
            
            try DbMigrate.migrate()
            
            try WebServer.initialize()
            
           // let serviceWorkerHandler = try ServiceWorkerHandler();
          //  let messageHandler = HybridMessageHandler();
            
          //  try messageHandler.setPort(serviceWorkerHandler.webServerPort);
            
            let rootWindow = UIWindow(frame: UIScreen.mainScreen().bounds);
            //rootWindow.backgroundColor = UIColor.whiteColor();
            
            let rootController = UINavigationController()
            let hwController = UIViewController()
            let hw = HybridWebview(frame: CGRect(x: 0, y: 0, width: 0, height: 0))
            
            hwController.view = hw
            
            rootController.pushViewController(hwController, animated: false)
            
            rootWindow.rootViewController = rootController
            
            self.window = rootWindow;
            rootWindow.makeKeyAndVisible();
            
            // todo: remove
            ServiceWorkerManager.clearActiveServiceWorkers()
            
            ServiceWorkerManager.getServiceWorkerForURL(NSURL(string:"http://www.gdnmobilelab.com")!)
            .then { sw -> Promise<Void>  in
                if sw != nil {
                    return Promise<Void>()
                }
                
                let workerContextPath = NSBundle.mainBundle().pathForResource("sw", ofType: "js", inDirectory: "gdn-mobile-lab-build")!
                let workerJS = NSData(contentsOfFile: workerContextPath)
  
                return ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"https://www.gdnmobilelab.com/sw.js")!, scope: NSURL(string:"https://www.gdnmsdobilelab.com/")!, lastModified: -1, js: workerJS!, installState: ServiceWorkerInstallState.Activated)
                .then { _ in
                    hw.loadRequest(NSURLRequest(URL: NSURL(string:"https://www.gdnmobilelab.com/apps/notify")!))
                    return Promise<Void>()
                }
                
            }.onError { err -> Void in
                log.error(String(err))
            }
            
            
            return true
            
            
        } catch {
            print(error);
            return false;
        }
        
    }
    
    func applicationWillResignActive(application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
    }
    
    func applicationDidEnterBackground(application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }
    
    func applicationWillEnterForeground(application: UIApplication) {
        // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
    }
    
    func applicationDidBecomeActive(application: UIApplication) {
        // Restart any tasks that were paused (or not yet started) while the application was inactive. If the application was previously in the background, optionally refresh the user interface.
    }
    
    func applicationWillTerminate(application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }
    
    
}

