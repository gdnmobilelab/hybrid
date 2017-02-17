//
//  NavigationContext.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation


class HybridWebviewContext {
    
    let webview:HybridWebview
//    let serviceWorkerContainer:ServiceWorkerContainer

    init(webview:HybridWebview) {
        self.webview = webview
//        self.serviceWorkerContainer = ServiceWorkerContainer(webview: self.webview)
    }
    
    func getRegisterCommands() -> [RegisterItemCommand] {
        
        var commands = [RegisterItemCommand]()
        
//        commands.append(RegisterItemCommand(path: ["navigator"], name: "serviceWorker", item: self.serviceWorkerContainer))
        
        return commands
        
    }
    
}
