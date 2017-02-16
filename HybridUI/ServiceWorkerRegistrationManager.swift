//
//  ServiceWorkerRegistrationManager.swift
//  hybrid
//
//  Created by alastair.coote on 16/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

class ServiceWorkerRegistrationManager {
    
    fileprivate var registrations = [URL : ServiceWorkerRegistration]()
    
    func getRegistration(forScope: URL) -> ServiceWorkerRegistration? {
        return self.registrations[forScope]
    }
    
    func addRegistration(_ registration: ServiceWorkerRegistration) throws {
        
        if self.registrations[registration.scope] != nil {
            throw ErrorMessage("Registration already exists for this scope.")
        }
        
        self.registrations[registration.scope] = registration
        
    }
    
}
