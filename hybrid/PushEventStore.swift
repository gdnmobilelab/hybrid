//
//  PushEventStore.swift
//  hybrid
//
//  Created by alastair.coote on 14/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class PushEventDefaultStore : UserDefaultStore<PendingPushEvent> {
    
    init() {
        super.init(storeKey: "pending_push_events", classNameAsString: "PendingPushEvent")
    }
    
    func getByWorkerURL(workerURL:String) -> [PendingPushEvent] {
        let all = self.getAll()

        return all.filter({ (pushEvent) -> Bool in
            return pushEvent.serviceWorkerURL == workerURL
        })
    }
    
    override func getAll() -> [PendingPushEvent] {
        return super.getAll().sort({ (el1, el2) -> Bool in
            return el1.dateAdded.compare(el2.dateAdded) == NSComparisonResult.OrderedAscending
        })

    }

}

var PendingPushEventStore = PushEventDefaultStore()
