//
//  ExtendableEvent.swift
//  hybrid
//
//  Created by alastair.coote on 10/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol ExtendableEventExports: JSExport {
    var type:String {get}
    init(type:String)
}

@objc class ExtendableEvent : NSObject, ExtendableEventExports {
    let type: String

    required init(type:String) {
        self.type = type
        super.init()
        
    }

}
