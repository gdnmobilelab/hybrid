//
//  ItemEventCommand.swift
//  hybrid
//
//  Created by alastair.coote on 15/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

struct ItemEventCommand : BridgeCommand {
    
    let target: HybridMessageReceiver
    let eventName: String
    let data: Any?
    
    
    func getPayload() -> [String : Any?] {
        return [
            "commandName": "itemevent",
            "target": target,
            "eventName": self.eventName,
            "eventData": self.data
        ]
    }
}
