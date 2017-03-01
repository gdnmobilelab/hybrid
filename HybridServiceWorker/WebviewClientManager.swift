//
//  WebviewClientManager.swift
//  hybrid
//
//  Created by alastair.coote on 16/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import PromiseKit
import HybridShared

@objc protocol WebviewClientManagerExports : JSExport {
    func claim() -> JSPromise
    func matchAll(_ options:JSValue) -> JSPromise
    
    @objc(openWindow::)
    func openWindow(_ url:String, options:AnyObject?) -> JSPromise
}


/// Rough emulation of the Clients object: https://developer.mozilla.org/en-US/docs/Web/API/Clients
@objc class WebviewClientManager : NSObject, WebviewClientManagerExports {
    
    
    let worker:ServiceWorkerInstance
    
    required init(worker:ServiceWorkerInstance) {
        self.worker = worker
    }
    
    
    /// This event emitter is listened to within HybridWebView.swift in-app, but also in NotificationViewController.swift
    /// in the notification content extension
    static let clientEvents = EventEmitter<PendingWebviewAction>()
    
    static func resetActiveWebviewRecords() {
        SharedResources.userDefaults.removeObject(forKey: SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
    }
    
    
    /// This is automatically synchronised with UserDefaults, making the records accessible cross-process.
    static var currentWebviewRecords: [WebviewRecord] {
        
        get {
            let recordsAsData = SharedResources.userDefaults.data(forKey: SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
            
            if recordsAsData == nil {
                // No store, so no active web view records
                return []
            }
            
            // There are weird issues with using this across different targets - it prefixes the class
            // identifier with the target name. So we need to overwrite that.
            
            NSKeyedUnarchiver.setClass(WebviewRecord.self, forClassName: "WebviewRecord")
            
            let records = NSKeyedUnarchiver.unarchiveObject(with: recordsAsData!) as! [WebviewRecord]
            
            return records
            
        }
        
        set(value) {
            
            if value.count == 0 {
                SharedResources.userDefaults.removeObject(forKey: SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
                return
            }
            
            NSKeyedArchiver.setClassName("WebviewRecord", for: WebviewRecord.self)
            
            let data = NSKeyedArchiver.archivedData(withRootObject: value)
            SharedResources.userDefaults.set(data, forKey: SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
            
        }
        
        
    }
    
    
    /// Dispatch an event to gather up all ServiceWorkerContainers that live under the scope of this
    /// worker. This will include both claimed and unclaimed clients.
    fileprivate func getAllEligibleClients() -> [WorkerClientProtocol] {
        let getClientsEvent = GetWorkerClientsEvent(scope: self.worker.scope)
        
        self.worker.dispatchEvent(getClientsEvent)
        
        return getClientsEvent.eligibleClients
    }
    
    
    /// Allows a worker to claim any webviews under its scope and become their active worker
    func claim() -> JSPromise {
        
        let eligibleClients = self.getAllEligibleClients()
        
        let claimPromises = eligibleClients.map { $0.claim(by: self.worker) }
        
        return PromiseToJSPromise<Void>.pass(when(fulfilled: claimPromises))
    }
    
    
    /// Find all webviews that fall under the current worker scope
    func matchAll(_ options: JSValue) -> JSPromise {
        
        let matchingRecords = WebviewClientManager.currentWebviewRecords.filter { record in
            return false
//            if record.workerId == nil {
//                return false
//            }
//            return record.workerId! == self.serviceWorker.instanceId
        }
        
        let matchesToClients = matchingRecords.map {record in
            return WindowClient(url: record.url!.absoluteString, uniqueId: String(record.index))
        }
        
        return JSPromise.resolve(matchesToClients as AnyObject?)
        
    }
    @objc(openWindow::)
    /// Open a new webview with the selected URL. Implements non-standard options argument, if external:true
    /// is provided in this options object, we will pass the open on to the OS rather than open a webview.
    ///
    /// - Parameters:
    ///   - url: The URL to open
    ///   - options: An object, currently the 'external' attribute is the only one supported.
    func openWindow(_ url:String, options:AnyObject?) -> JSPromise {
        
        let urlToOpen = URL(string: url,relativeTo: self.worker.scope)!
        
        var optionsToSave: [String:AnyObject] = [
            "urlToOpen": urlToOpen.absoluteString as AnyObject
        ]
        
        if let optionsExists = options {
            optionsToSave["openOptions"] = optionsExists
        }
        
        let newEvent = PendingWebviewAction(type: PendingWebviewActionType.openWindow, record: nil, options: optionsToSave)
        
        WebviewClientManager.clientEvents.emit("*", newEvent)
        
        return JSPromise.resolve(nil)
    }
    
    
}
