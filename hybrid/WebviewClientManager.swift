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
import OMGHTTPURLRQ

@objc protocol WebviewClientExports : JSExport {
    var url:String {get}
    var id:String {get}
    func postMessage(message:String, ports: [MessagePort], callback:JSValue)
}

@objc class WebviewClient : NSObject, WebviewClientExports {
    var url:String
    var id:String
    
    init(url:String, uniqueId:String) {
        self.url = url
        self.id = uniqueId
    }
    
    func postMessage(message: String, ports: [MessagePort], callback:JSValue) {
        do {
            let port = SharedSettings.storage.objectForKey(SharedSettings.WEBSERVER_PORT_KEY)
            
            if port == nil {
                
                // Shouldn't be any way for this to happen, but you never know
                
                log.error("Tried to postMessage to webview, but server isn't running?")
                let error = JSValue(newErrorFromMessage: "Web server is not running?", inContext: callback.context)
                callback.callWithArguments([error])
                return
            }
            
            let url = NSURLComponents(string: "http://localhost/__activeWebviews/" + String(self.id))!
            url.port = port as! Int
        
            let postRequest = try OMGHTTPURLRQ.POST(url.URL!.absoluteString!, JSON: [
                "message": message,
                "numberOfPorts": ports.count
            ])
            
            // This doesn't actually return anything. So when we know we can successfully post, callback
            
            callback.callWithArguments([])
            
            NSURLConnection.promise(postRequest)
            .then { response -> Void in
                let jsonResponse = try NSJSONSerialization.JSONObjectWithData(response, options: []) as! [String]
                
                for (idx, portResponse) in jsonResponse.enumerate() {
                    
                    ports[idx].postStringMessage(portResponse)
                }
            }
            
            
        } catch {
            let jsError = JSValue(newErrorFromMessage: String(error), inContext: callback.context)
            callback.callWithArguments([jsError])
        }
    }
}

@objc protocol WebviewRecordExports : JSExport {
    var url:NSURL? {get}
}

@objc class WebviewRecord : NSObject, NSCoding, WebviewRecordExports {
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

@objc protocol WebviewClientManagerExports : JSExport {
    func claimCallback(callback:JSValue)
    func matchAll(options:JSValue, callback:JSValue)
    func openWindow(url:String, callback:JSValue)
}

@objc class WebviewClientManager : NSObject, WebviewClientManagerExports {
    
    
    
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
        
//        if options.isNull == false && options.isUndefined == false {
//            // TODO: implement this
//            
//            callback.callWithArguments([JSValue(newErrorFromMessage: "options not implemented yet", inContext: callback.context)])
//            return
//        }
        
//        WebviewClientManager.getCurrentWebviewRecords()
//        .then { records -> Void in
//            
//            let matchingRecords = records.filter { record in
//                
//                if record.workerId == nil {
//                    return false
//                }
//                return record.workerId! == self.serviceWorker.instanceId
//            }
//            
//            let matchesToClients = matchingRecords.map {record in
//                return WebviewClient(url: record.url!.absoluteString!, uniqueId: String(record.index))
//            }
//            
//            callback.callWithArguments([JSValue(nullInContext: callback.context), matchesToClients])
//        }
//        .error { err in
//            callback.callWithArguments([JSValue(newErrorFromMessage: String(err), inContext: callback.context)])
//        }
        
        
        callback.callWithArguments([JSValue(nullInContext: callback.context), []])
    }
    
    func openWindow(url:String, callback:JSValue) {
        
        let urlToOpen = NSURL(string: url,relativeToURL: self.serviceWorker.scope)!
        
        PendingNotificationActions.urlToOpen = urlToOpen.absoluteString
        callback.callWithArguments([JSValue(nullInContext: callback.context)])
    }
    
    required init(serviceWorker:ServiceWorkerInstance) {
        self.serviceWorker = serviceWorker
    }
}
