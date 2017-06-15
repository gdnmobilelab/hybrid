//
//  ServiceWorkerGlobalScope.swift
//  ServiceWorker
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol ServiceWorkerGlobalScopeExports : JSExport {
    
}

@objc class ServiceWorkerGlobalScope : EventTarget, ServiceWorkerGlobalScopeExports {
    
    let console:ConsoleMirror
    
    init(context:JSContext) {
        self.console = ConsoleMirror(console: context.objectForKeyedSubscript("console"))
        super.init()
        context.setObject(self, forSubscriptString: "self")
        context.setObject(Event.self, forSubscriptString: "Event")
    }
    
}
