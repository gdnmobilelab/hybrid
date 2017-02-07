//
//  PendingNotificationAction.swift
//  hybrid
//
//  Created by alastair.coote on 16/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import HybridShared

/// The different types of event that can be passed from service worker to the app.
///
/// - Claim: Claim a webview for a new service worker install. Replaces any existing worker in navigator.serviceWorker.active
/// - Focus: Focus on this window. Makes more sense in multi-tab browsers, but in app it will pop the navigation stack to this webview.
/// - OpenWindow: Open a new webview for the selected URL. If {external:true} is passed in options it'll instead pass the URL to the OS.
/// - PostMessage: Send a message to this webview. Currently cannot have MessagePorts attached as they don't work cross-process.
enum PendingWebviewActionType: Int32 {
    case claim = 0
    case focus
    case openWindow
    case postMessage
}


/// A serializable/deserializable class for recording events service workers want to send across to webviews. Stored in
/// UserDefaults and queried when the app starts, resumes from suspend, etc.
@objc class PendingWebviewAction: NSObject, NSCoding {
    var type:PendingWebviewActionType
    var record:WebviewRecord?
    var uuid:String
    var options:[String: Any]?
    
    // This is a total hack, but if we're in the same process our events evaluate immediately, and we might
    // want to wait for that. This adds a lot of uncertainty, though
    var onImmediateExecution:(() -> ())?
    
    convenience init(type:PendingWebviewActionType, record: WebviewRecord?) {
        self.init(type: type, record: record, options: nil)
    }
    
    init(type:PendingWebviewActionType, record: WebviewRecord?, options: [String:Any]?) {
        self.type = type
        self.record = record
        self.options = options
        self.uuid = UUID().uuidString
    }
    
    
    /// Private init to create an instance with our predefined UUID
    fileprivate convenience init(type:PendingWebviewActionType, record: WebviewRecord?, options: [String:Any]?, uuid:String) {
        self.init(type: type, record: record, options: options)
        self.uuid = uuid
    }
    
    convenience required init?(coder decoder: NSCoder) {
        let type = PendingWebviewActionType(rawValue: decoder.decodeCInt(forKey: "type"))!
        let record = decoder.decodeObject(forKey: "record") as? WebviewRecord
        let options = decoder.decodeObject(forKey: "options") as? Data
        let uuid = decoder.decodeObject(forKey: "uuid") as! String
        
        var optionsAsAny:[String : AnyObject]? = nil
        if options != nil {
            
            do {
                let decoded = try JSONSerialization.jsonObject(with: options!, options: [])
                optionsAsAny = decoded as? [String : AnyObject]
            } catch {
                log.error("Unable to decode JSON string from storage. " + String(describing: error))
            }
            
        }
        
        self.init(type: type, record: record, options: optionsAsAny, uuid: uuid)
        
    }
    
    func encode(with coder: NSCoder) {
        coder.encodeCInt(self.type.rawValue, forKey: "type")
        coder.encode(self.uuid, forKey: "uuid")
        
        if let record = self.record {
            coder.encode(record, forKey: "record")
        }
        
        if let options = self.options {
            
            do {
                let jsonString = try JSONSerialization.data(withJSONObject: options, options: [])
                coder.encode(jsonString, forKey: "options")
            } catch {
                log.error("Unable to serialize event options to JSON. " + String(describing: error))
            }
        }
        
        
    }
    
}
