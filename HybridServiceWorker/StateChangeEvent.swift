//
//  StateChangeEvent.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

@objc protocol StateChangeEventExports : JSEvent {
    var target: ServiceWorkerInstance { get }
}

@objc public class StateChangeEvent : NSObject, StateChangeEventExports {
    
    public let type = "statechange"
    public let target: ServiceWorkerInstance
    
    init(workerInstance: ServiceWorkerInstance) {
        self.target = workerInstance
    }
}
