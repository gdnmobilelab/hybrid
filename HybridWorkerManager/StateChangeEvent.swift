//
//  StateChangeEvent.swift
//  hybrid
//
//  Created by alastair.coote on 23/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker
import HybridShared

/// The Service Worker API emits state change events before actually updating the property on the worker
/// so, when the ready promise resolves, the worker is actually still at .activating. So we use this
/// struct to mirror that - it contains the new state, while the worker is still set to the old state.
public class PendingWorkerStateChangeEvent : JSEvent {
    
    public static let type = "statechange"

    public let newState: ServiceWorkerInstallState
    public let worker: ServiceWorkerInstance
    
    init(worker: ServiceWorkerInstance, newState: ServiceWorkerInstallState) {
        self.newState = newState
        self.worker = worker
        
    }
}
