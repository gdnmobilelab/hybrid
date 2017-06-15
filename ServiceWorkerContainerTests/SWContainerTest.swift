//
//  SWContainerTest.swift
//  ServiceWorkerContainerTests
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import XCTest
import CleanroomLogger
import HybridShared


class SWContainerTest: XCTestCase {
    
    class DBResetError : Error {}
    
    fileprivate var isSetup = false
    
    fileprivate func globalSetup () {
        Log.enable()
        self.isSetup = true
    }
    
    func failOnErrors(_ block: () throws -> Void) {
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
    
    func shouldError(_ block: () throws -> Void) {
        do {
            try block()
            XCTFail("Expected an error to be thrown but it was not")
        } catch {
            
        }
    }
    
    override func setUp() {
        super.setUp()
        if (self.isSetup == false) {
            self.globalSetup()
        }
        do {
            try Database.inTransaction { db in
                let result = db.executeStatements("""
                    DELETE FROM workers;
                    DELETE FROM registrations;
                """)
                
                if result == false {
                    throw DBResetError()
                }
                
                db.closeOpenResultSets()
                
            }
        } catch {
            fatalError()
        }
    }
}
