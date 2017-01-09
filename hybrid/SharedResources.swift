//
//  File.swift
//  hybrid
//
//  Created by alastair.coote on 12/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


/// In order to share data between our notification extension and our main app, we have to use an app group.
/// This is a quick utility class to avoid having to type the app group name everywhere.
class SharedResources {
    
    enum ExecutionEnvironment {
        case app
        case notificationContentExtension
        case unknown
    }
    
    static var appGroupName = Bundle.main.object(forInfoDictionaryKey: "APP_GROUP_NAME") as! String
    
    static var currentExecutionEnvironment = ExecutionEnvironment.unknown
    
    
    /// Mostly just to avoid typos, some hard-coded keys that we use when storing data.
    class userDefaultKeys {
        static let APP_CURRENTLY_ACTIVE_KEY = "appCurrentlyActive"
        static let ACTIVE_WEBVIEWS_KEY = "currentActiveWebviews"
    }
    
    
    /// The shared UserDefaults storage that we store things like pending notifications actions in.
    static let userDefaults = UserDefaults(suiteName: appGroupName)!
    
    
    /// The shared directory where we store our database files.
    static let fileSystemURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupName)!
}
