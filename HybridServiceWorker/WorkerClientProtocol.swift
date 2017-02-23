//
//  WorkerClientProtocol.swift
//  hybrid
//
//  Created by alastair.coote on 23/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

public protocol WorkerClientProtocol {
    
    func postMessage(_ message: Any, transfer: [Any]) -> Void
    func claim(by worker:ServiceWorkerInstance) -> Void
    
    var frameType: String { get }
    var id: String { get }
    var url: String { get }
    
    var controller: ServiceWorkerInstance? { get }
   
}
