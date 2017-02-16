//
//  HybridMessageReceiver.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit

protocol HybridMessageReceiver {
    
    var jsClassName: String { get }
    
    var hashValue: Int { get }
    
    func getInitialData() -> Any?

    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>?
    
}
