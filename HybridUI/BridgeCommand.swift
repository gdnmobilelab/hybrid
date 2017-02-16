//
//  BridgeCommand.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

protocol BridgeCommand {
    
    func getPayload() -> [String: Any?]
}
