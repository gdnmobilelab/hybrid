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

@objc protocol WebviewRecordExports : JSExport {
    var url:NSURL? {get}
}


/// We use this class to record what webviews we currently have open in the app. It's used for cross-process
/// stuff, like when a service worker inside the notification content calls Clients.matchAll().
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


/// The different types of event that can be passed from service worker to the app.
///
/// - Claim: Claim a webview for a new service worker install. Replaces any existing worker in navigator.serviceWorker.active
/// - Focus: Focus on this window. Makes more sense in multi-tab browsers, but in app it will pop the navigation stack to this webview.
/// - OpenWindow: Open a new webview for the selected URL. If {external:true} is passed in options it'll instead pass the URL to the OS.
/// - PostMessage: Send a message to this webview. Currently cannot have MessagePorts attached as they don't work cross-process.
enum WebviewClientEventType: Int32 {
    case Claim = 0
    case Focus
    case OpenWindow
    case PostMessage
}


/// A serializable/deserializable class for recording events service workers want to send across to webviews. Stored in 
/// UserDefaults and queried when the app starts, resumes from suspend, etc.
@objc class WebviewClientEvent: NSObject, NSCoding {
    var type:WebviewClientEventType
    var record:WebviewRecord?
    
    var options:[String: AnyObject]?
    
    init(type:WebviewClientEventType, record: WebviewRecord?) {
        self.type = type
        self.record = record
    }
    
    init(type:WebviewClientEventType, record: WebviewRecord?, options: [String:AnyObject]?) {
        self.type = type
        self.record = record
        self.options = options
    }
    
    convenience required init?(coder decoder: NSCoder) {
        let type = WebviewClientEventType(rawValue: decoder.decodeIntForKey("type"))!
        let record = decoder.decodeObjectForKey("record") as? WebviewRecord
        let options = decoder.decodeObjectForKey("options") as? NSData
        
        var optionsAsAny:[String : AnyObject]? = nil
        if options != nil {
            
            do {
                let decoded = try NSJSONSerialization.JSONObjectWithData(options!, options: [])
                optionsAsAny = decoded as? [String : AnyObject]
            } catch {
                log.error("Unable to decode JSON string from storage. " + String(error))
            }

        }
        
        self.init(type: type, record: record, options: optionsAsAny)

    }
    
    func encodeWithCoder(coder: NSCoder) {
        coder.encodeInt(self.type.rawValue, forKey: "type")
        
        if let record = self.record {
            coder.encodeObject(record, forKey: "record")
        }
        
        if let options = self.options {
            
            do {
                let jsonString = try NSJSONSerialization.dataWithJSONObject(options, options: [])
                coder.encodeObject(jsonString, forKey: "options")
            } catch {
                log.error("Unable to serialize event options to JSON. " + String(error))
            }
        }

        
    }
    
}

@objc protocol WebviewClientManagerExports : JSExport {
    func claimCallback(callback:JSValue)
    func matchAll(options:JSValue, callback:JSValue)
    func openWindow(url:String, options:AnyObject, callback:JSValue)
}


/// Rough emulation of the Clients object: https://developer.mozilla.org/en-US/docs/Web/API/Clients
@objc class WebviewClientManager : NSObject, WebviewClientManagerExports {
    

    let serviceWorker:ServiceWorkerInstance
    
    
    
    /// This event emitter is listened to within HybridWebView.swift in-app, but also in NotificationViewController.swift
    /// in the notification content extension
    static let clientEvents = Event<WebviewClientEvent>()
    
    static func resetActiveWebviewRecords() {
        SharedResources.userDefaults.removeObjectForKey(SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
    }
    
    
    /// This is automatically synchronised with UserDefaults, making the records accessible cross-process.
    static var currentWebviewRecords: [WebviewRecord] {
        
        get {
            let recordsAsData = SharedResources.userDefaults.dataForKey(SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
            
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
                SharedResources.userDefaults.removeObjectForKey(SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
                return
            }
            
            NSKeyedArchiver.setClassName("WebviewRecord", forClass: WebviewRecord.self)
            
            let data = NSKeyedArchiver.archivedDataWithRootObject(value)
            SharedResources.userDefaults.setObject(data, forKey: SharedResources.userDefaultKeys.ACTIVE_WEBVIEWS_KEY)
            
        }
        
        
    }
    
    
    /// Allows a worker to claim any webviews under its scope and become their active worker
    ///
    /// - Parameter callback: Callback to run on completion - is wrapped into a promise in js-src
    func claimCallback(callback:JSValue) {
        
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
    
    
    /// Find all webviews that fall under the current worker scope
    ///
    /// - Parameters:
    ///   - options: Currently not implemented. Details here: https://developer.mozilla.org/en-US/docs/Web/API/Clients/matchAll
    ///   - callback: Callback to run on completion. Mapped to a promise in js-src
    func matchAll(options:JSValue, callback:JSValue) {

        let matchingRecords = WebviewClientManager.currentWebviewRecords.filter { record in
            
            if record.workerId == nil {
                return false
            }
            return record.workerId! == self.serviceWorker.instanceId
        }
        
        let matchesToClients = matchingRecords.map {record in
            return WindowClient(url: record.url!.absoluteString!, uniqueId: String(record.index))
        }
        
        callback.callWithArguments([JSValue(nullInContext: callback.context), matchesToClients])
        
    }
    
    /// Open a new webview with the selected URL. Implements non-standard options argument, if external:true
    /// is provided in this options object, we will pass the open on to the OS rather than open a webview.
    ///
    /// - Parameters:
    ///   - url: The URL to open
    ///   - options: An object, currently the 'external' attribute is the only one supported.
    ///   - callback: Callback to run on completion. Wrapped into a promise in js-src
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
