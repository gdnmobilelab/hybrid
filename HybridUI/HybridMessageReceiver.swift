//
//  HybridMessageReceiver.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit

protocol HybridMessageReceiver {
    
    var hashValue: Int { get }
    
    static var jsClassName: String { get }
    
    static func createFromJSArguments(args: [Any?], from: HybridMessageManager) throws -> HybridMessageReceiver
    
    func getArgumentsForJSMirror() throws -> [Any?]
    
    func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>?
    
    func unload()
    
}
