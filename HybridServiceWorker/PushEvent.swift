//
//  PushEvent.swift
//  hybrid
//
//  Created by alastair.coote on 15/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore

@objc protocol PushEventExports : JSExport {
    var data: PushMessageData {get}
}

@objc class PushEvent: ExtendableEvent, PushEventExports {
    
    let data: PushMessageData
    
    init(dataAsString:String) {
        self.data = PushMessageData(data: dataAsString.data(using: String.Encoding.utf8)!)
        super.init(type: "push")
    }
    
    required init(type: String) {
        fatalError("init(type:) has not been implemented")
    }
}
