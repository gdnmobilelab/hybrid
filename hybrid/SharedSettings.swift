//
//  File.swift
//  hybrid
//
//  Created by alastair.coote on 12/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


class SharedSettings {
    static let WEBSERVER_PORT_KEY = "webServerPort"
    static let APP_CURRENTLY_ACTIVE_KEY = "appCurrentlyActive"
    static let storage = NSUserDefaults(suiteName: "group.gdnmobilelab.hybrid")!
}
