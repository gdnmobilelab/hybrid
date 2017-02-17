//
//  ResolvePromiseCommand.swift
//  hybrid
//
//  Created by alastair.coote on 15/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

struct ResolvePromiseCommand : BridgeCommand {
    
    let data: Any?
    let promiseId: Int
    let error: Error?
    
    func getMsgFromError(_ err: Error) -> String {
        let asMsg = err as? ErrorMessage
        var msg = String(describing: err)
        
        if let isMsg = asMsg {
            msg = isMsg.message
        }
        
        return msg
    }
    
    func getPayload() -> [String : Any?] {
    
        
        return [
            "commandName": "resolvepromise",
            "promiseId": self.promiseId,
            "data": self.data,
            "error": self.error != nil ? self.getMsgFromError(self.error!) : nil
        ]
    }
    
}
