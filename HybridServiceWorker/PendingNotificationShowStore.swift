//
//  PendingNotificationShowStore.swift
//  hybrid
//
//  Created by alastair.coote on 14/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

class PendingNotificationDefaultStore : UserDefaultStore<PendingNotificationShow> {
    
    init() {
        super.init(storeKey: "pending_notification_show", classNameAsString: "PendingNotificationShow")
    }
    
    func getByPushID(_ pushID:String) -> PendingNotificationShow? {
        let all = self.getAll()
        
        return all.filter { $0.pushID == pushID }.first
    }
    
    override func equals(_ lhs: PendingNotificationShow, rhs: PendingNotificationShow) -> Bool {
        return lhs.pushID == rhs.pushID
    }
}

var PendingNotificationShowStore = PendingNotificationDefaultStore()
