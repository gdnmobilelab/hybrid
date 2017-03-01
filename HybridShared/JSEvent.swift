//
//  JSEvent.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc public protocol JSEvent : JSExport {
    static var type: String { get }
}


extension JSEvent {
    var type:String {
        get {
            return type(of:self).type
        }
    }
}
