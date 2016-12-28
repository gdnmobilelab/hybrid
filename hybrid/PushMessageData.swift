//
//  PushMessageData.swift
//  hybrid
//
//  Created by alastair.coote on 18/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol PushMessageDataExports : JSExport {
    func json() -> AnyObject?
    func text() -> String?
}

/// Based on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData, but actually just uses FetchBody
@objc class PushMessageData : NSObject, PushMessageDataExports {
    
    let pushData:Data
    
    init(data:Data) {
        self.pushData = data
    }
    
    func json() -> AnyObject? {
        var obj:AnyObject? = nil
        
        do {
            obj = try JSONSerialization.jsonObject(with: self.pushData, options: [])
        } catch {
            log.error("Cannot throw error back to JS Context, but JSON parse of event data failed: " + String(error))
        }

        return obj
    }
    
    func text() -> String? {
        return String(data: self.pushData, encoding: String.Encoding.utf8)
    }
}
