//
//  WebviewMessage.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

struct WebviewMessage {
    let command: String
    let data: Any?
    let webview:HybridWebview
}
