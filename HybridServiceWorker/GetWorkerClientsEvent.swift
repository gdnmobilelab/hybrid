//
//  GetWorkerClientsEvent.swift
//  hybrid
//
//  Created by alastair.coote on 23/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation


/// Because our worker and client code lives in separate libraries, we use events like
/// these as bridges. This event lets us gather up all eligible clients for a worker.
public class GetWorkerClientsEvent : ServiceWorkerEvent {
    
    var eligibleClients = [WorkerClientProtocol]()
    
    func addEligibleClient(client: WorkerClientProtocol) {
        self.eligibleClients.append(client)
    }
    
}
