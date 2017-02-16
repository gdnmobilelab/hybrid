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
    var type: String { get }
}
