//
//  NotificationShowOptions.swift
//  hybrid
//
//  Created by alastair.coote on 09/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

public struct NotificationShowOptions {
    let actions: [NotificationAction]?
    let badge: URL?
    let body: String?
    let icon: URL?
    let image: URL?
    let renotify: Bool
    let tag: String?
    let vibrate: [Int]?
    let data: AnyObject?
}
