//
//  ServiceWorkerEvent.swift
//  hybrid
//
//  Created by alastair.coote on 23/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

open class ServiceWorkerEvent {
    
    public let worker: ServiceWorkerInstance
    
    public init(worker: ServiceWorkerInstance) {
        self.worker = worker
    }
    
}
