//
//  ServiceWorkerInstance.swift
//  hybrid
//
//  Created by alastair.coote on 08/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
@testable import hybrid


class ServiceWorkerWebSQLSpec: QuickSpec {
    override func spec() {
        
        beforeEach({
            do {
                let dbPath = try Db.getFullDatabasePath("filetest", dbFilename: "test_db")
                try NSFileManager.defaultManager().removeItemAtPath(dbPath)
            } catch {
                
            }
            
        })
        
        describe("Service Worker WebSQL") {
            it("should successfully run a read-only query") {
                
                waitUntil { done in
                    
                    let sw = ServiceWorkerInstance(url: "file://test")
                    
                    sw.loadServiceWorker("")
                        .then {_ in
                            return sw.runScript(
                                "var testPromise = function() {" +
                                "   return new Promise(function(fulfill, reject) {" +
                                "       var db = hybrid.openDatabase('test_db', '0.1', 'Test DB', 1024 * 1024);" +
                                "       db.readTransaction(function(t) {" +
                                "           t.executeSql('SELECT 111 as test_response',[], function(t, results) {" +
                                "               fulfill(results.rows.item(0).test_response);" +
                                "           })" +
                                "       });" +
                                "   });" +
                                "};"
                            )
                        .then {_ in 
                            return sw.executeJSPromise("testPromise()")
                        }.then { (returnValue:JSValue) -> Void in
                            expect(returnValue.toInt32()).to(equal(111))
                            done()
                        }
                        .recover { (err:ErrorType) -> Void in
                            expect(err).to(beNil())
                            done()
                    }
                    
                }
            }
            
            
        }
            
            it("should successfully run a write query") {
                
                waitUntil { done in
                    
                    let sw = ServiceWorkerInstance(url: "file://test")
                    
                    let sql = "CREATE TABLE test (" +
                        "\"testvalue\" TEXT NOT NULL" +
                        ");" +
                        "INSERT INTO test (testvalue) VALUES (?);" +
                        "INSERT INTO test (testvalue) VALUES (?);"
                    
                    sw.loadServiceWorker("")
                        .then {_ in
                            return sw.runScript(
                                "var testPromise = function() {" +
                                    "   return new Promise(function(fulfill, reject) {" +
                                    "       var db = hybrid.openDatabase('test_db', '0.1', 'Test DB', 1024 * 1024);" +
                                    "       db.transaction(function(t) {" +
                                    "           t.executeSql('" + sql + "',['test'], function(t, results) {" +
                                    "               console.log(results);fulfill(results.rowsAffected);" +
                                    "           })" +
                                    "       });" +
                                    "   });" +
                                "};"
                                )
                                .then {_ in
                                    return sw.executeJSPromise("testPromise()")
                                }.then { (returnValue:JSValue) -> Void in
                                    expect(returnValue.toInt32()).to(equal(111))
                                    done()
                                }
                                .recover { (err:ErrorType) -> Void in
                                    expect(err).to(beNil())
                                    done()
                            }
                            
                    }
                }
            }
            
            
        
        
        }
    }
}