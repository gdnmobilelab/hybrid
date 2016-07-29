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
import FMDB
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
                    
                    let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!, installState: ServiceWorkerInstallState.Installed)
 
                    sw.loadServiceWorker("")
                        .then {_ in
                            return sw.runScript(
                                "var testPromise = function() {" +
                                "   return new Promise(function(fulfill, reject) {" +
                                "       var db = openDatabase('test_db', '0.1', 'Test DB', 1024 * 1024);" +
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
                    
                    let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!, installState: ServiceWorkerInstallState.Installed)

                    let sql = "CREATE TABLE test (" +
                        "\"testvalue\" TEXT NOT NULL" +
                        ");"
                    
                    sw.loadServiceWorker("")
                        .then {_ in
                            return sw.runScript(
                                "var testPromise = function() {" +
                                "   return new Promise(function(fulfill, reject) {" +
                                "       var db = openDatabase('test_db', '0.1', 'Test DB', 1024 * 1024);" +
                                "       db.transaction(function(t) {" +
                                "           t.executeSql('" + sql + "',[], function(t2, results) {" +
                                "               t.executeSql('INSERT INTO test (testvalue) VALUES (?), (?);',['test','test2'], function(t, results2) {fulfill(results2.rowsAffected);})" +
                                "           })" +
                                "       });" +
                                "   });" +
                                "};"
                                )
                                .then {_ in
                                    return sw.executeJSPromise("testPromise()")
                                }.then { (returnValue:JSValue) -> Void in
                                    expect(returnValue.toInt32()).to(equal(2))
                                    
                                    let testDBPath = try Db.getFullDatabasePath("filetest", dbFilename: "test_db")
                                    
                                    let db = FMDatabase(path: testDBPath)
                                    db.open()
                                    let resultSet = try db.executeQuery("SELECT * FROM test", values: [])
                                    
                                    expect(resultSet.next()).to(beTrue())

                                    expect(resultSet.stringForColumn("testvalue")).to(equal("test"))
                                    db.close()
                                    done()
                                }
                                .recover { (err:ErrorType) -> Void in
                                    expect(err).to(beNil())
                                    done()
                            }
                            
                    }
                }
            }
            
            xit("should pass IndexedDB tests") {
                
                var mochaJS = ""
                var testJS = ""
                
                do {
                    let mochaJSPath = NSBundle.mainBundle().pathForResource("mocha", ofType: "js", inDirectory: "js-dist")!
                    let testJSPath = NSBundle.mainBundle().pathForResource("indexeddb-test", ofType: "js", inDirectory: "js-dist")!
                    
                    testJS = try NSString(contentsOfFile: testJSPath, encoding: NSUTF8StringEncoding) as String
                    mochaJS = try NSString(contentsOfFile: mochaJSPath, encoding: NSUTF8StringEncoding) as String
                    
                } catch {
                    expect(error).to(beNil())
                }
                
                let sw = ServiceWorkerInstance(url: NSURL(string: "file://test/test.js")!, scope: NSURL(string: "file://test")!, installState: ServiceWorkerInstallState.Installed)

                
                waitUntil(timeout: 30) { done in
 
                    sw.loadServiceWorker("global.Date = Date; global.setTimeout = setTimeout; global.clearTimeout = clearTimeout;" + mochaJS)
                        
                        .then {_ in
                            return sw.applyGlobalVariables()
                        }
                        .then {_ in
                            return sw.runScript(testJS + ";0;")
                        }
                        .then {_ in
                            return sw.executeJSPromise("global.runTests()")
                        }
                        .then { (result:JSValue) -> Void in
//                            let resultAsObj = result.toObject() as! [String: JSValue]
//                            
//                            let failuresArray = resultAsObj["failures"]!.toArray()
//                            let f = failuresArray.count
                            done()
                    }.error { error in
                        expect(error).to(beNil())
                        done()
                    }
                }
                
                
            }
            
            
        
        
        }
    }
}