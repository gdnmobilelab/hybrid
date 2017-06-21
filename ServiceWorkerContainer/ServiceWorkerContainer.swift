//
//  ServiceWorkerContainer.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import PromiseKit
import HybridShared
import Shared

public class ServiceWorkerContainer {
    
    let containerURL: URL
    
    init(forURL: URL) {
        self.containerURL = forURL
    }
    
    public static var logger:SharedLogInterface {
        get {
            return Shared.Log
        }
        set(value) {
            Shared.Log = value
        }
    }
    
    func register(workerURL: URL, options: ServiceWorkerRegistrationOptions?) -> Bool {
        
//        return firstly {
        
            var scopeURL = self.containerURL
            if let scope = options?.scope {
                // By default we register to the current URL, but we can specify
                // another scope.
//                if scopeURL.host != self.containerURL.host || workerURL.host != self.containerURL.host {
//                    throw ErrorMessage("Service worker scope must be on the same domain as both the page and worker URL")
//                }
                scopeURL = scope
            }
            
//            var reg = try ServiceWorkerRegistration.ensureExists(scope: scopeURL)
            
            return true
//            return Promise(value:true)
//        }
        
    }
    
}
