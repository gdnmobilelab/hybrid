//
//  ServiceWorkerLogInterface.swift
//  ServiceWorker
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

public struct ServiceWorkerLogInterface {
    public var debug: ((String) -> Void)?
    public var info: ((String) -> Void)?
    public var warn: ((String) -> Void)?
    public var error: ((String) -> Void)?
}

// We want to be able to plug in a custom logging interface depending on environment.
// This var is here for quick access inside the SW code (Log?.info()), but can be set
// via ServiceWorker.logInterface in external code.
var Log = ServiceWorkerLogInterface(debug: nil, info: nil, warn: nil, error: nil)
