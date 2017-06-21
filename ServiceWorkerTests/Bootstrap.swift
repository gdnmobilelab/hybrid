//
//  Bootstrap.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import ServiceWorker
import CleanroomLogger
import Shared

public class TestBootstrap : NSObject {
    override init() {
        super.init()
        Log.enable()
        
        Shared.Log.debug = { Log.debug?.message($0) }
        Shared.Log.info = { Log.info?.message($0) }
        Shared.Log.warn = { Log.warning?.message($0) }
        Shared.Log.error = { Log.error?.message($0) }
    }
}
