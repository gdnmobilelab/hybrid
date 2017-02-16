//
//  RelatedWorkerType.swift
//  hybrid
//
//  Created by alastair.coote on 08/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation


/// These are the different types of worker that can be attached to a Service Worker Registration
/// https://developer.mozilla.org/en-US/docs/Web/API/ServiceWorkerRegistration
enum RelatedWorkerType {
    case waiting
    case installing
    case active
}
