//
//  RegisterItemCommand.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

struct RegisterItemCommand : BridgeCommand {
    
    let path: [String]
    let name: String
    let item: HybridMessageReceiver
    
    func getPayload() -> [String : Any?] {
        return [
            "commandName": "registerItem",
            "path": self.path,
            "name": self.name,
            "item": self.item
        ]
    }
    
}
