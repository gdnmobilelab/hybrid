//
//  ErrorMessageAssertions.swift
//  TestShared
//
//  Created by alastair.coote on 15/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared
import XCTest

public func AssertNoErrorMessage(_ block: () throws -> Void) {
    do {
        try block()
    } catch {
        
        if let errMsg = error as? ErrorMessage {
            XCTFail(errMsg.message)
        } else {
            XCTFail(String(describing: error))
        }
        
    }
}

public func AssertHasErrorMessage(_ block: () throws -> Void) {
    do {
        try block()
        XCTFail("Expected an error to be thrown but it was not")
    } catch {
        
    }
}
