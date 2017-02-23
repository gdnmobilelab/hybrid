//
//  SharedResources.swift
//  hybrid
//
//  Created by alastair.coote on 12/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


/// In order to share data between our notification extension and our main app, we have to use an app group.
/// This is a quick utility class to avoid having to type the app group name everywhere.
public class SharedResources {
    
    public static var appGroupName = "group.com.gdnmobilelab.hybrid"
    
    public static var currentExecutionEnvironment = ExecutionEnvironment.unknown
    
    
    /// Mostly just to avoid typos, some hard-coded keys that we use when storing data.
    public class userDefaultKeys {
        public static let APP_CURRENTLY_ACTIVE_KEY = "appCurrentlyActive"
        public static let ACTIVE_WEBVIEWS_KEY = "currentActiveWebviews"
    }
    
    
    /// The shared UserDefaults storage that we store things like pending notifications actions in.
    public static let userDefaults = UserDefaults(suiteName: appGroupName)!
    
    
    /// The shared directory where we store our database files.
    public static let fileSystemURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupName)!
    
    /// Because we have content extensions, mainBundle() can sometimes return an extension
    /// rather than the app itself. This function detects that, and resets it, so we know for
    /// sure that we are always receiving the app bundle.
    ///
    /// - Returns: An NSBundle for the main hybrid app
    public static var appBundle: Bundle {
        get {
            var bundle = Bundle.main
            if bundle.bundleURL.pathExtension == "appex" {
                // Peel off two directory levels - MY_APP.app/PlugIns/MY_APP_EXTENSION.appex
                bundle = Bundle(url: (bundle.bundleURL as NSURL).deletingLastPathComponent!.deletingLastPathComponent())!
            }
            return bundle

        }
    }
    
    public static let ApplicationEvents = EventEmitter<Any>()
    
    public static var allowedServiceWorkerDomains:[String] {
        
        get {
            let str = SharedResources.appBundle.object(forInfoDictionaryKey: "SERVICE_WORKER_ENABLED_DOMAINS") as! String
            let split = str.components(separatedBy: ",")
            
            return split
        }
        
    }
}
