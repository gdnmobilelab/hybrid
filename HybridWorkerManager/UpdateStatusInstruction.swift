//
//  UpdateStatusInstruction.swift
//  hybrid
//
//  Created by alastair.coote on 08/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridServiceWorker

struct UpdateStatusInstruction {
    let id:Int
    let newState: ServiceWorkerInstallState
}
