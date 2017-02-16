//
//  ReturnSerializer.swift
//  hybrid
//
//  Created by alastair.coote on 13/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore

@testable import HybridUI


class ServiceWorkerCacheSpec: QuickSpec {
    
    class ExampleReceiver: NSObject, HybridMessageReceiver {
        
        let jsClassName = "ExampleReceiver"
        var testValue = "initial test value"
        
        func getInitialData() -> Any? {
            return self.testValue
        }
        
        func receiveMessage(_ msg: WebviewMessage) -> Promise<Any?>? {
            return nil
        }
        
        
    }
    
    func getDeepValue(_ obj: [String: Any], _ values: [String]) -> Any {
        
        var currentIndex = 0
        var currentObject = obj
        
        while currentIndex < values.count {
            
            let key = values[currentIndex]
            
            if currentIndex == values.count - 1 {
                return currentObject[key]!
            }
            
            currentObject = currentObject[key] as! [String: Any]
            currentIndex = currentIndex + 1
        }
        
        return currentObject
        
    }
    
    
    override func spec() {
        
        describe("Webview Bridge Serializer") {
            
            it("detect when the same item is being sent twice, and detect new items") {
                expect {
                    let hw = HybridWebview(frame: CGRect(x:0,y:0,width:0,height:0))
                    
                    hw.loadHTMLString("", baseURL: URL(string: "https://www.example.com")!)
                    
                    let testItem = ExampleReceiver()
                    
                    let testThing:[String : Any] = [
                        "anArray": [testItem],
                        "asObjectValue": testItem,
                        "nested": [
                            "nestedValue": testItem
                        ],
                        "newValue": ExampleReceiver()
                    ]
                    
                    let serialized = try ReturnSerializer.serialize(testThing, manager: hw.webviewDelegate.messageHandler)
                    
                    let asObjectValue = self.getDeepValue(serialized, ["value", "asObjectValue", "index"]) as! Int
                    
                    expect(asObjectValue).to(equal(0))
                    
                    let asArray = self.getDeepValue(serialized, ["value", "anArray", "value"]) as! [Any]
                    let asArrayItem = self.getDeepValue(asArray[0] as! [String: Any], ["index"]) as! Int
                    
                    expect(asArrayItem).to(equal(0))
                    
                    let nested = self.getDeepValue(serialized, ["value", "nested", "value", "nestedValue", "index"]) as! Int
                    
                    expect(nested).to(equal(0))
                    
                    let newValue = self.getDeepValue(serialized, ["value", "newValue", "index"]) as! Int
                    
                    expect(newValue ).to(equal(1))
                    
                    return true
                    
                }.toNot(throwError())
            }
        }
    }
}
