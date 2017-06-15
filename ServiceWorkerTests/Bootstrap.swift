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

public class TestBootstrap : NSObject {
    override init() {
        super.init()
        Log.enable()
        
        ServiceWorker.logInterface.debug = { Log.debug?.message($0) }
        ServiceWorker.logInterface.info = { Log.info?.message($0) }
        ServiceWorker.logInterface.warn = { Log.warning?.message($0) }
        ServiceWorker.logInterface.error = { Log.error?.message($0) }
    }
}
