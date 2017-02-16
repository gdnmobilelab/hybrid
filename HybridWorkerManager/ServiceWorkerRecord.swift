//
//  ServiceWorkerRecord.swift
//  hybrid
//
//  Created by alastair.coote on 08/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared
import HybridServiceWorker

struct ServiceWorkerRecord {
    let id: Int
    let url: URL
    let scope: URL
    let headers: FetchHeaders
    let lastChecked: Int
    let installState: ServiceWorkerInstallState
}
