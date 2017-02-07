//
//  ErrorMessage.swift
//  hybrid
//
//  Created by alastair.coote on 15/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

public class ErrorMessage : Error {
    
    let message:String
    
    public init(_ msg:String) {
        self.message = msg
    }
}
