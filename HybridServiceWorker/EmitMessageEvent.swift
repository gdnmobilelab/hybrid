//
//  EmitMessageEvent.swift
//  hybrid
//
//  Created by alastair.coote on 27/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

class EmitMessageEvent : JSEvent {
    
    public static let type = "emit"
    
    public let data:Any
    public let transfer: [MessagePort]
    
    init(data: Any, transfer: [MessagePort]) {
        self.data = data
        self.transfer = transfer
    }
    
}
