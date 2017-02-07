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

class JSTests: QuickSpec {
    override func spec() {
        
    
        describe("Service Worker JS-based tests") {
            
            
            beforeEach({
                
            })
            
            waitUntil(timeout: 10000) { done in
                let b = Bundle(for: JSTests.self)
                
                let testsJSPath = b.path(forResource: "tests", ofType: "js", inDirectory: "js-dist")!
                let testJS:String
                
                do {
                    testJS = try String(contentsOfFile: testsJSPath, encoding: String.Encoding.utf8)
                    
                    let jsContext = JSContext()!
                    
                    jsContext.exceptionHandler = { (a,b) in
                        let error = b!
                        NSLog(b!.toString())
                    }
                    
                    jsContext.evaluateScript(testJS)
                    
                    let runFunc = jsContext
                        .objectForKeyedSubscript("this")
                        .objectForKeyedSubscript("tests")
                        .objectForKeyedSubscript("runTests")
                    
                    let test = { (result:JSValue) in
                        NSLog("wtf")
                        done()
                    }
                    
                    
                    runFunc!.call(withArguments: [test])
                    
//                    let isObj = thisVal?.isObject
                    NSLog("YAY")
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
