//
//  ServiceWorkerInstanceRecord.swift
//  hybrid
//
//  Created by alastair.coote on 08/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker
import PromiseKit
import HybridShared


/// This wrapper around ServiceWorkerInstance listens for status changes affecting this worker and other
/// workers with the same URL and scope, and forwards them to the instance accordingly.
class ServiceWorkerInstanceBridge: Hashable {
    
    let instance: ServiceWorkerInstance
    let id:Int
    let registration: ServiceWorkerRegistration
    let getClientsListener: Listener<ServiceWorkerEvent>
    
    fileprivate init(record: ServiceWorkerRecord, manager: ServiceWorkerManager) {
        self.registration = ServiceWorkerRegistration(scope: record.scope, scriptURL: record.url, manager: manager)
        self.instance = ServiceWorkerInstance(url: record.url, scope: record.scope, installState: record.installState, registration: self.registration)
        self.id = record.id
        
        // We set this listener to re-broadcast getClient events. Clients will use the function on the GetWorkerClientsEvent
        // to register themselves as prospective clients
        self.getClientsListener = self.instance.events.on("getclients", { ev in
            manager.lifecycleEvents.emit("getclients", ev)
        })
    }
    
    
    func destroy() {
        self.instance.destroy()
        self.instance.events.off("getclients", self.getClientsListener)
//        self.manager.lifecycleEvents.off("statechange", self.stateUpdateListener!)
    }
    
    
    var hashValue: Int {
        get {
            return self.id
        }
    }
    
    // This means that our activeServiceWorkers set will only ever have one version of a worker active at a time.
    public static func ==(lhs: ServiceWorkerInstanceBridge, rhs: ServiceWorkerInstanceBridge) -> Bool {
        return lhs.hashValue == rhs.hashValue
    }
    
    static func create(record: ServiceWorkerRecord, contents: String, manager:ServiceWorkerManager) -> Promise<ServiceWorkerInstanceBridge> {
        
        let activeWorker = ServiceWorkerInstanceBridge(record: record, manager: manager)
        
        return activeWorker.instance.loadServiceWorker(contents)
        .then {
            return activeWorker
        }
        
    }
}
