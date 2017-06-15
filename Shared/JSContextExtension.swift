//
//  JSContextExtension.swift
//  Shared
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore

extension JSContext {
    
    public func setObject(_ object: Any!, forSubscriptString: String) {
        self.setObject(object, forKeyedSubscript:forSubscriptString as (NSCopying & NSObjectProtocol)!)
    }
    
}
