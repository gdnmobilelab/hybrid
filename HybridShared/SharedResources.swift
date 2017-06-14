//
//  SharedResources.swift
//  HybridShared
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

/// In order to share data between our notification extension and our main app, we have to use an app group.
/// This is a quick utility class to avoid having to type the app group name everywhere.
public class SharedResources {
    
    public static var appGroupName = "group.com.gdnmobilelab.hybrid"
    
    /// The shared directory where we store our database files.
    public static let fileSystemURL = FileManager.default.containerURL(forSecurityApplicationGroupIdentifier: appGroupName)!
    
}
