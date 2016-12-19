//
//  PendingWebviewActions.swift
//  hybrid
//
//  Created by alastair.coote on 02/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

/// Our notification extension cannot communicate directly with our webviews, so when a notification
/// action triggers a webview action we store it. Then pick it back up when the app launches.
class PendingWebviewActionsDefault : UserDefaultStore<PendingWebviewAction> {
   
    init() {
        super.init(storeKey: "pending_webview_actions", classNameAsString: "PendingWebviewAction")
    }
    
    
}

var PendingWebviewActions = PendingWebviewActionsDefault()
