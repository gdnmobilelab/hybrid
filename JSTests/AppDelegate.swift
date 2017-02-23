//
//  AppDelegate.swift
//  MobileLab
//
//  Created by alastair.coote on 14/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import UIKit
@testable import HybridUI
import HybridShared

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {
    
    static var window: UIWindow?
    
    
    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplicationLaunchOptionsKey: Any]?) -> Bool {
        // Override point for customization after application launch.
        
        do {
            try Db.createMainDatabase()
            
            AppDelegate.window = UIWindow(frame: UIScreen.main.bounds)
            
            let coordinator = HybridUIContainer(withStartingURL: URL(string: "http://localhost:9000/browser-tests.html")!)
            try coordinator.workerManager.removeAllWorkersFromDatabase()
            
            
            AppDelegate.window!.rootViewController = coordinator.controller
            AppDelegate.window!.makeKeyAndVisible()
            
            return true
        } catch {
            log.error(String(describing: error))
            return false
            
        }
    }
    
}

