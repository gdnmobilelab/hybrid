//
//  ServiceWorkerManager.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore

@testable import hybrid


class ServiceWorkerManagerSpec: QuickSpec {
    
    
    override func spec() {
        
        beforeEach {
            do {
                try Db.mainDatabase.inDatabase({ (db) in
                    try db.executeUpdate("DELETE FROM service_workers", values: [])
                })
            } catch {
                expect(error).to(beNil())
            }
            
        }
        
        describe("Service Worker Manager") {
            
            it("should return nil with no service worker") {
                
                waitUntil { done in
                    ServiceWorkerManager.getServiceWorkerForURL(NSURL(string:"http://test.com/")!)
                    .then { (sw) -> Void in
                        expect(sw).to(beNil())
                        done()
                    }
                    .error { err in
                        expect(err).to(beNil())
                    }
                }
               
            }
            
            it("should fetch SW URL when scope matches") {
                
                waitUntil { done in
                    Promise<Void>()
                    .then {
                        try Db.mainDatabase.inDatabase({ (db) in
                            try db.executeUpdate("INSERT INTO service_workers (url, scope, install_state, last_modified, contents) VALUES (?,?,?,?,?)", values: ["http://test.com/sw.js", "http://test.com", ServiceWorkerInstallState.Activated.hashValue, 1, ""])
                            
                            ServiceWorkerManager.getServiceWorkerForURL(NSURL(string:"http://test.com/test")!)
                            .then { (sw) -> Void in
                                expect(sw).toNot(beNil())
                                done()
                            }
                        })
                        
                    }
                }
               
            }
        }
    }
}
