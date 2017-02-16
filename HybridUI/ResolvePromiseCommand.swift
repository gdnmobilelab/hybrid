//
//  ResolvePromiseCommand.swift
//  hybrid
//
//  Created by alastair.coote on 15/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

struct ResolvePromiseCommand : BridgeCommand {
    
    let data: Any?
    let promiseId: Int
    let error: Error?
    
    func getPayload() -> [String : Any?] {
        return [
            "commandName": "resolvepromise",
            "promiseId": self.promiseId,
            "data": self.data,
            "error": self.error != nil ? String(describing: self.error!) : nil
        ]
    }
    
}
