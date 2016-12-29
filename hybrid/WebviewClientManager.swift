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

@objc protocol WebviewRecordExports : JSExport {
    var url:URL? {get}
}


/// We use this class to record what webviews we currently have open in the app. It's used for cross-process
/// stuff, like when a service worker inside the notification content calls Clients.matchAll().
@objc class WebviewRecord : NSObject, NSCoding, WebviewRecordExports {
    var url:URL?
    var index:Int
    var workerId: Int?
    
    init(url: URL?, index: Int, workerId:Int?) {
        self.url = url
        self.index = index
        self.workerId = workerId
    }
    
    // Use NSCoding to allow us to store this in UserDefaults
    
    convenience required init?(coder decoder: NSCoder) {
        let urlString = decoder.decodeObject(forKey: "url") as? String
        var url:URL? = nil
        if urlString != nil {
            url = URL(string: urlString!)
        }
        
        let workerId = decoder.decodeObject(forKey: "workerId") as? Int
        let index = decoder.decodeInteger(forKey: "index")
        
        self.init(url: url, index: index, workerId: workerId)
    }
    
    func encode(with coder: NSCoder) {
        coder.encode(self.url?.absoluteString, forKey: "url")
        coder.encode(self.index, forKey: "index")
        coder.encode(self.workerId, forKey: "workerId")
    }
    
}



@objc protocol WebviewClientManagerExports : JSExport {
    func claim() -> JSPromise
    func matchAll(_ options:JSValue) -> JSPromise
    
    @objc(openWindow::)
    func openWindow(_ url:String, options:AnyObject?) -> JSPromise
}


/// Rough emulation of the Clients object: https://developer.mozilla.org/en-US/docs/Web/API/Clients
@objc class WebviewClientManager : NSObject, WebviewClientManagerExports {
    

    let serviceWorker:ServiceWorkerInstance
    
    
    
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
    
    
    /// Allows a worker to claim any webviews under its scope and become their active worker
    func claim() -> JSPromise {
        
        let claimPromises = WebviewClientManager.currentWebviewRecords.map { record -> Promise<Void> in
            if record.url == nil || record.url!.absoluteString.hasPrefix(self.serviceWorker.scope.absoluteString) == false {
                return Promise(value: ())
            } else {
                
                // We put this in an event bridge because out notificiation content extension
                // needs to be able to emit these events, which unfortunately means we need
                // to store such events for execution later
                
                let ev = PendingWebviewAction(type: PendingWebviewActionType.claim, record: record, options: [
                    "newServiceWorkerId": self.serviceWorker.instanceId as AnyObject
                ])
                
                if SharedResources.currentExecutionEnvironment == SharedResources.ExecutionEnvironment.app {
                    // We're in the app, so we want to wait for immediate execution
                    
                    return Promise<Void> { fulfill, reject in
                        ev.onImmediateExecution = fulfill
                        WebviewClientManager.clientEvents.emit("*", ev)
                    }
                    
                } else {
                    WebviewClientManager.clientEvents.emit("*", ev)
                    return Promise(value: ())
                }
                
            }
        }
        
        return PromiseToJSPromise<Void>.pass(when(fulfilled: claimPromises))
    }
    
    
    /// Find all webviews that fall under the current worker scope
    func matchAll(_ options: JSValue) -> JSPromise {

        let matchingRecords = WebviewClientManager.currentWebviewRecords.filter { record in
            
            if record.workerId == nil {
                return false
            }
            return record.workerId! == self.serviceWorker.instanceId
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
        
        let urlToOpen = URL(string: url,relativeTo: self.serviceWorker.scope as URL?)!
        
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
    
    required init(serviceWorker:ServiceWorkerInstance) {
        self.serviceWorker = serviceWorker
    }
}
