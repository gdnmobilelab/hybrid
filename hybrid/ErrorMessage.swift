//
//  ErrorMessage.swift
//  hybrid
//
//  Created by alastair.coote on 15/12/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class ErrorMessage : ErrorType {
    
    let message:String
    
    init(msg:String) {
        self.message = msg
    }
}
