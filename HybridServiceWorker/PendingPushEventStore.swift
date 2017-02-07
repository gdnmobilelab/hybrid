//
//  PushEventStore.swift
//  hybrid
//
//  Created by alastair.coote on 14/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

class PushEventDefaultStore : UserDefaultStore<PendingPushEvent> {
    
    init() {
        super.init(storeKey: "pending_push_events", classNameAsString: "PendingPushEvent")
    }
    
    func getByWorkerURL(_ workerURL:String) -> [PendingPushEvent] {
        let all = self.getAll()
        
        return all.filter({ (pushEvent) -> Bool in
            return pushEvent.serviceWorkerURL == workerURL
        })
    }
    
    func getByPushID(_ pushID:String) -> PendingPushEvent? {
        let all = self.getAll()
        
        return all.filter { $0.pushID == pushID }.first
    }
    
    override func getAll() -> [PendingPushEvent] {
        return super.getAll().sorted(by: { (el1, el2) -> Bool in
            return el1.dateAdded.compare(el2.dateAdded as Date) == ComparisonResult.orderedAscending
        })
        
    }
    
    override func equals(_ lhs: PendingPushEvent, rhs: PendingPushEvent) -> Bool {
        return lhs.uuid == rhs.uuid
    }
    
}

var PendingPushEventStore = PushEventDefaultStore()
