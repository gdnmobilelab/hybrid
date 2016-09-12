//
//  WebviewClientManager.swift
//  hybrid
//
//  Created by alastair.coote on 16/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore
import EmitterKit
import PromiseKit

@objc protocol WebviewClientManagerExports : JSExport {
    func claimCallback(callback:JSValue)
    func matchAll(options:JSValue, callback:JSValue)
    func openWindow(url:String, callback:JSValue)
}

@objc class WebviewClientManager : NSObject, WebviewClientManagerExports {
    
    class WebviewRecord : NSObject, NSCoding {
        var url:NSURL?
        var index:Int
        var workerId: Int?
        
        init(url: NSURL?, index: Int, workerId:Int?) {
            self.url = url
            self.index = index
            self.workerId = workerId
        }
        
        // Use NSCoding to allow us to store this in UserDefaults
        
        convenience required init?(coder decoder: NSCoder) {
            let url = decoder.decodeObjectForKey("url") as? NSURL
            let index = decoder.decodeObjectForKey("index") as! Int
            let workerId = decoder.decodeObjectForKey("workerId") as? Int
            self.init(url: url, index: index, workerId: workerId)
        }
        
        func encodeWithCoder(coder: NSCoder) {
            coder.encodeObject(self.url, forKey: "url")
            coder.encodeObject(self.index, forKey: "index")
            coder.encodeObject(self.workerId, forKey: "workerId")
        }
    }
    
    let serviceWorker:ServiceWorkerInstance
    
    // Workers running inside the notification context still need to know what webviews we have
    // active (if any). So we store this data inside the shared UserDefaults store, which allows
    // it to be readable across processes.
    
    private static let groupDefaults = NSUserDefaults(suiteName: "group.gdnmobilelab.hybrid")!
    
    static let claimEvents = Event<(WebviewRecord, Int)>()
    
    
    static func getCurrentWebviewRecords() -> Promise<[WebviewRecord]> {
        
        // In order to communicate cross-process, we reuse our web server
        
        
        let port = SharedSettings.storage.objectForKey(SharedSettings.WEBSERVER_PORT_KEY)
        
        if port == nil {
            // If the web server is deactivated then we have no active webviews
            return Promise<[WebviewRecord]>([WebviewRecord]())
        }
        
        let url = NSURLComponents(string: "http://localhost/__activeWebviews")!
        url.port = port as! Int
        
        return Promisified.AlamofireRequest("GET", url: url.URL!)
        .then { r in
            return NSKeyedUnarchiver.unarchiveObjectWithData(r.data!) as! [WebviewRecord]
        }
        .recover { error -> [WebviewRecord] in
            // Thus should have been caught by the above port check.
            log.error(String(error))
            return [WebviewRecord]()
        }
    }
    
    func claimCallback(callback:JSValue) {
        
        // Allows a worker to take control of clients within its scope.
        
        WebviewClientManager.getCurrentWebviewRecords()
        .then { records -> Void in
            records.forEach { record in
                if record.url == nil {
                    return
                }
                if record.url!.absoluteString!.hasPrefix(self.serviceWorker.scope.absoluteString!) {
                    
                    // We don't pass the service worker itself because (at some point) we're going to need
                    // to allow this to execute inside the notification environment and (somehow) map
                    // over to an existing app.
                    
                    WebviewClientManager.claimEvents.emit((record, self.serviceWorker.instanceId))
                }
            }
            
            callback.callWithArguments([])
        }
        .error { err in
            callback.callWithArguments([JSValue(newErrorFromMessage: String(err), inContext: callback.context)])
        }
        
    }
    
    func matchAll(options:JSValue, callback:JSValue) {
        // TODO: implement
        
        callback.callWithArguments([JSValue(nullInContext: callback.context), JSValue(newArrayInContext: callback.context)])
    }
    
    func openWindow(url:String, callback:JSValue) {
        PendingNotificationActions.urlToOpen = url
        callback.callWithArguments([JSValue(nullInContext: callback.context)])
    }
    
    required init(serviceWorker:ServiceWorkerInstance) {
        self.serviceWorker = serviceWorker
    }
}
