//
//  ServiceWorkerStub.swift
//  hybrid
//
//  Created by alastair.coote on 15/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


/// Quick struct to be used in the ServiceWorkerManager to grab an existing worker
/// without having to create a full ServiceWorkerInstance, complete with JSContext, etc
struct ServiceWorkerStub {
    var instanceId:Int
    var installState:ServiceWorkerInstallState
    var lastChecked:Int
    var scope:NSURL
    var jsHash:NSData
}
