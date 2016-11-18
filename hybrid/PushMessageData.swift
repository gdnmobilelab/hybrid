//
//  PushMessageData.swift
//  hybrid
//
//  Created by alastair.coote on 18/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


/// Based on https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData, but actually just uses FetchBody
@objc class PushMessageData : FetchBody {
    
    /// As per the docs (https://developer.mozilla.org/en-US/docs/Web/API/PushMessageData), the data in
    /// PushMessageData can be used over and over again, so we override bodyUsed to always return false.
    override var bodyUsed: Bool {
        get {
            return false
        }
        set {
            // disregard
        }
    }
}
