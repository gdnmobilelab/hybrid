//
//  InstallEvent.swift
//  hybrid
//
//  Created by alastair.coote on 28/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import HybridShared

@objc public class InstallEvent: ExtendableEvent, ExtendableEventExports, ExtendableEventProtocol {
    public static let type = "install"
}
