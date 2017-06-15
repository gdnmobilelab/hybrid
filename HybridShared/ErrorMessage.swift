//
//  ErrorMessage.swift
//  HybridShared
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

public class ErrorMessage : Error {
    
    public let message:String
    
    public init(_ message:String) {
        self.message = message
    }
}
