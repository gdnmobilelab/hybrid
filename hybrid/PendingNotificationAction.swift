//
//  PendingNotificationAction.swift
//  hybrid
//
//  Created by alastair.coote on 16/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

/// The different types of event that can be passed from service worker to the app.
///
/// - Claim: Claim a webview for a new service worker install. Replaces any existing worker in navigator.serviceWorker.active
/// - Focus: Focus on this window. Makes more sense in multi-tab browsers, but in app it will pop the navigation stack to this webview.
/// - OpenWindow: Open a new webview for the selected URL. If {external:true} is passed in options it'll instead pass the URL to the OS.
/// - PostMessage: Send a message to this webview. Currently cannot have MessagePorts attached as they don't work cross-process.
enum PendingWebviewActionType: Int32 {
    case Claim = 0
    case Focus
    case OpenWindow
    case PostMessage
}


/// A serializable/deserializable class for recording events service workers want to send across to webviews. Stored in
/// UserDefaults and queried when the app starts, resumes from suspend, etc.
@objc class PendingWebviewAction: NSObject, NSCoding {
    var type:PendingWebviewActionType
    var record:WebviewRecord?
    var uuid:String
    var options:[String: AnyObject]?
    
    convenience init(type:PendingWebviewActionType, record: WebviewRecord?) {
        self.init(type: type, record: record, options: nil)
    }
    
    init(type:PendingWebviewActionType, record: WebviewRecord?, options: [String:AnyObject]?) {
        self.type = type
        self.record = record
        self.options = options
        self.uuid = NSUUID().UUIDString
    }
    
    
    /// Private init to create an instance with our predefined UUID
    private convenience init(type:PendingWebviewActionType, record: WebviewRecord?, options: [String:AnyObject]?, uuid:String) {
        self.init(type: type, record: record, options: options)
        self.uuid = uuid
    }
    
    convenience required init?(coder decoder: NSCoder) {
        let type = PendingWebviewActionType(rawValue: decoder.decodeIntForKey("type"))!
        let record = decoder.decodeObjectForKey("record") as? WebviewRecord
        let options = decoder.decodeObjectForKey("options") as? NSData
        let uuid = decoder.decodeObjectForKey("uuid") as! String
        
        var optionsAsAny:[String : AnyObject]? = nil
        if options != nil {
            
            do {
                let decoded = try NSJSONSerialization.JSONObjectWithData(options!, options: [])
                optionsAsAny = decoded as? [String : AnyObject]
            } catch {
                log.error("Unable to decode JSON string from storage. " + String(error))
            }
            
        }
        
        self.init(type: type, record: record, options: optionsAsAny, uuid: uuid)
        
    }
    
    func encodeWithCoder(coder: NSCoder) {
        coder.encodeInt(self.type.rawValue, forKey: "type")
        coder.encodeObject(self.uuid, forKey: "uuid")
        
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
