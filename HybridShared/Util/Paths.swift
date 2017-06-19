//
//  Paths.swift
//  HybridShared
//
//  Created by alastair.coote on 19/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

public class Paths {
    
    public static var AppStorage = SharedResources.appGroupStorage.appendingPathComponent("hybrid.sqlite")
    
    public static func domainStorage(forDomain: String) -> URL {
        return SharedResources.appGroupStorage.appendingPathComponent(forDomain + "/")
    }
    
}
