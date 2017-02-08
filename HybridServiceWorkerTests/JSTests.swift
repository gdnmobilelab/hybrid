//
//  JSTests.swift
//  hybrid
//
//  Created by alastair.coote on 06/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import JavaScriptCore
import HybridServiceWorker
import HybridShared


struct TAPTestResult {
    let name: String
    var items: [[String:AnyObject]] = []
}

class JSTests: QuickSpec {
    
    func splitResultsIntoTests(items: [[String: AnyObject]]) throws -> [TAPTestResult] {
        
        var tests: [TAPTestResult] = []
        
        var currentTest: TAPTestResult? = nil
        
        for item in items {
            
            let type = item["type"] as! String
            
            if type == "test" {
                
                if currentTest != nil {
                    throw ErrorMessage("Test within a test?")
                }
                
                currentTest = TAPTestResult(name: item["name"] as! String, items: [])
                
            } else if type == "end" {
                
                if currentTest == nil {
                    throw ErrorMessage("End without a current test?")
                }
                
                tests.append(currentTest!)
                currentTest = nil
                
            } else {
                currentTest!.items.append(item)
            }
        }
        
        return tests
    }
    
    override func spec() {
        
    
        describe("Service Worker JS-based tests") {
            
            

            
            waitUntil(timeout: 1000000) { done in
                let b = Bundle(for: JSTests.self)
                
                let testsJSPath = b.path(forResource: "tests", ofType: "js", inDirectory: "js-dist")!
                let testJS:String
                
                do {
                    testJS = try String(contentsOfFile: testsJSPath, encoding: String.Encoding.utf8)
                    
                    let testURL = URL(string:"https://www.example.com")!
                    
                    let sw = ServiceWorkerInstance(url: testURL, scope: testURL, instanceId: 1, installState: ServiceWorkerInstallState.activated)
                    
                    sw.loadServiceWorker(testJS)
                    .then { () -> Void in
                        
                        let channel = MessageChannel()
                        
                        channel.port1.events.once("message", { msg in
                            let data = msg!.data as! [[String: AnyObject]]
                            
                            do {
                                let parsedItems = try self.splitResultsIntoTests(items: data)
                            
                                for parsedItem in parsedItems {
                                    
                                    it(parsedItem.name) {
                                        for subitem in parsedItem.items {
                                            expect(subitem["ok"] as! Bool).to(be(true))
                                            
                                        }
                                    }
                                    
                                }
                                
                                done()
                            } catch {
                                NSLog("error?")
                            }
                            
                            NSLog("blah")
                        })
                        
                        let ev = ExtendableMessageEvent(data: nil, ports: [channel.port2])
                        
                        sw.dispatchExtendableEvent(ev)
                    }
                    .catch {err in
                        NSLog("Oh no, error")
                    }
                    
                    
                    
                } catch { error
//                    done(error)
                }
                
                
                
                
                it("should successfully run a read-only query") {
                    return true
                    
                }
                
                
            }
            
            
        }
    }
}
