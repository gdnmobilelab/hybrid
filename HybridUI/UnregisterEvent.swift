//
//  UnregisterEvent.swift
//  hybrid
//
//  Created by alastair.coote on 01/03/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

class UnregisterEvent : JSEvent {
    static let type = "unregister"
    
    let registration:ServiceWorkerRegistration
    
    init(_ reg: ServiceWorkerRegistration) {
        self.registration = reg
    }
}
