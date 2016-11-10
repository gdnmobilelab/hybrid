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
    func focus()
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
    
    func focus() {
        
        
        let record = WebviewRecord(url: NSURL(string: self.url), index: Int(self.id)!, workerId: nil)
        
        // workerId maybe shouldn't be nil but we don't know it here, and the focus event doesn't need it
        let newEvent = WebviewClientEvent(type: WebviewClientEventType.Focus, record: record)
        WebviewClientManager.clientEvents.emit(newEvent)
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

enum WebviewClientEventType: Int32 {
    case Claim = 0
    case Focus
    case OpenWindow
}

@objc class WebviewClientEvent: NSObject, NSCoding {
    var type:WebviewClientEventType
    var record:WebviewRecord?
//    var newServiceWorkerId:Int? // used for claim events only
//    var urlToOpen:String? // used for window open events
    
    var options:[String: AnyObject]?
    
    init(type:WebviewClientEventType, record: WebviewRecord?) {
        self.type = type
        self.record = record
    }
    
    init(type:WebviewClientEventType, record: WebviewRecord?, options: [String:AnyObject]?) {
        self.type = type
        self.record = record
        self.options = options
//        self.newServiceWorkerId = newWorkerId
//        self.urlToOpen = urlToOpen
    }
    
    convenience required init?(coder decoder: NSCoder) {
        let type = WebviewClientEventType(rawValue: decoder.decodeIntForKey("type"))!
        let record = decoder.decodeObjectForKey("record") as? WebviewRecord
        let options = decoder.decodeObjectForKey("options") as? NSDictionary
        
        var dict: [String: AnyObject]? = nil
        if options != nil {
            dict = [String:AnyObject]()
            
            
            for key in options!.keyEnumerator() {
                dict![key as! String] = options!.objectForKey(key as! String)
            }
            
        }
        
        self.init(type: type, record: record, options: dict)

    }
    
    func encodeWithCoder(coder: NSCoder) {
        coder.encodeInt(self.type.rawValue, forKey: "type")
        
        if let record = self.record {
            coder.encodeObject(record, forKey: "record")
        }
        
        if let options = self.options {
         
            let dict = NSDictionary(dictionary: options)
            
            coder.encodeObject(dict, forKey: "options")
        }

        
    }
    
}

@objc protocol WebviewClientManagerExports : JSExport {
    func claimCallback(callback:JSValue)
    func matchAll(options:JSValue, callback:JSValue)
    func openWindow(url:String, options:AnyObject, callback:JSValue)
}

@objc class WebviewClientManager : NSObject, WebviewClientManagerExports {
    
    
    
    let serviceWorker:ServiceWorkerInstance
    
    // Workers running inside the notification context still need to know what webviews we have
    // active (if any). So we store this data inside the shared UserDefaults store, which allows
    // it to be readable across processes.
    
    //static let claimEvents = Event<(WebviewRecord, Int)>()
    
    static let clientEvents = Event<WebviewClientEvent>()
    
    static func resetActiveWebviewRecords() {
        SharedSettings.storage.removeObjectForKey(SharedSettings.ACTIVE_WEBVIEWS_KEY)
    }
    
    static var currentWebviewRecords: [WebviewRecord] {
        
        get {
            let recordsAsData = SharedSettings.storage.dataForKey(SharedSettings.ACTIVE_WEBVIEWS_KEY)
            
            if recordsAsData == nil {
                // No store, so no active web view records
                return []
            }
            
            // There are weird issues with using this across different targets - it prefixes the class
            // identifier with the target name. So we need to overwrite that.
            
            NSKeyedUnarchiver.setClass(WebviewRecord.self, forClassName: "WebviewRecord")
            
            let records = NSKeyedUnarchiver.unarchiveObjectWithData(recordsAsData!) as! [WebviewRecord]
            
            return records

        }
        
        set(value) {
            
            if value.count == 0 {
                SharedSettings.storage.removeObjectForKey(SharedSettings.ACTIVE_WEBVIEWS_KEY)
                return
            }
            
            NSKeyedArchiver.setClassName("WebviewRecord", forClass: WebviewRecord.self)
            
            let data = NSKeyedArchiver.archivedDataWithRootObject(value)
            SharedSettings.storage.setObject(data, forKey: SharedSettings.ACTIVE_WEBVIEWS_KEY)
            
        }
        
        
    }
    
    
    func claimCallback(callback:JSValue) {
        
        // Allows a worker to take control of clients within its scope.
        
        WebviewClientManager.currentWebviewRecords.forEach { record in
            if record.url == nil {
                return
            }
            if record.url!.absoluteString!.hasPrefix(self.serviceWorker.scope.absoluteString!) {
                
                // We put this in an event bridge because out notificiation content extension
                // needs to be able to emit these events, which unfortunately means we need
                // to store such events for execution later
                
                let ev = WebviewClientEvent(type: WebviewClientEventType.Claim, record: record, options: [
                    "newServiceWorkerId": self.serviceWorker.instanceId
                ])
                
                WebviewClientManager.clientEvents.emit(ev)
            }
        }
        
        callback.callWithArguments([])

        
    }
    
    func matchAll(options:JSValue, callback:JSValue) {
        
//        if options.isNull == false && options.isUndefined == false {
//            // TODO: implement this
//            
//            callback.callWithArguments([JSValue(newErrorFromMessage: "options not implemented yet", inContext: callback.context)])
//            return
//        }
        

        let matchingRecords = WebviewClientManager.currentWebviewRecords.filter { record in
            
            if record.workerId == nil {
                return false
            }
            return record.workerId! == self.serviceWorker.instanceId
        }
        
        let matchesToClients = matchingRecords.map {record in
            return WebviewClient(url: record.url!.absoluteString!, uniqueId: String(record.index))
        }
        
        callback.callWithArguments([JSValue(nullInContext: callback.context), matchesToClients])
        
    }
    
    func openWindow(url:String, options:AnyObject, callback:JSValue) {
        
        let urlToOpen = NSURL(string: url,relativeToURL: self.serviceWorker.scope)!
        
        let newEvent = WebviewClientEvent(type: WebviewClientEventType.OpenWindow, record: nil, options: [
            "urlToOpen": urlToOpen.absoluteString!,
            "openOptions": options
        ])
        
        WebviewClientManager.clientEvents.emit(newEvent)
 
        callback.callWithArguments([JSValue(nullInContext: callback.context)])
    }
    
    required init(serviceWorker:ServiceWorkerInstance) {
        self.serviceWorker = serviceWorker
    }
}
