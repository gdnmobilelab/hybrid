//
//  fs.swift
//  hybrid
//
//  Created by alastair.coote on 07/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class Fs {
    static var sharedStoreURL:NSURL {
        get {
            return NSFileManager.defaultManager().containerURLForSecurityApplicationGroupIdentifier("group.gdnmobilelab.hybrid")!
        }
    }
}
