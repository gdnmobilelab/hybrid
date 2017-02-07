//
//  WebviewRecord.swift
//  hybrid
//
//  Created by alastair.coote on 07/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

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
