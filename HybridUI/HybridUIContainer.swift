//
//  File.swift
//  hybrid
//
//  Created by alastair.coote on 16/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared
import HybridServiceWorker
import HybridWorkerManager

public class HybridUIContainer {
    
    let workerManager = ServiceWorkerManager()
    let registrationManager = ServiceWorkerRegistrationManager()
    public let controller = UIViewController()
    
    public init(withStartingURL: URL) {
        let wv = HybridWebview(container: self)
        
        wv.loadURL(URL(string: "http://localhost:9000/browser-tests.html")!)
        
        self.controller.view = wv
    }
    
}
