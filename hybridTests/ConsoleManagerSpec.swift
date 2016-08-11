//
//  ConsoleManagerSpec.swift
//  hybrid
//
//  Created by alastair.coote on 10/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
import XCGLogger
@testable import hybrid

public class GrabLog: XCGLogDestinationProtocol {
    public var owner: XCGLogger
    public var identifier: String
    public var outputLogLevel: XCGLogger.LogLevel = .Debug
    
    let doneFunc:() -> Void
    let messageToConfirm:String
    
    public func processLogDetails(logDetails: XCGLogDetails) {
        if logDetails.logMessage == self.messageToConfirm {
            self.doneFunc()
        }
    }
    
    public init(doneFunc: () -> Void, messageToConfirm:String) {
        self.owner = log
        self.identifier = "debugcheck"
        self.doneFunc = doneFunc
        self.messageToConfirm = messageToConfirm
    }
    
    public func processInternalLogDetails(logDetails: XCGLogDetails) {
    }
    
    public func isEnabledForLogLevel (logLevel: XCGLogger.LogLevel) -> Bool {
        return logLevel >= self.outputLogLevel
    }
    
    // MARK: - DebugPrintable
    public var debugDescription: String {
        get {
            return "DebugCheck"
        }
    }
}

class ConsoleManagerSpec: QuickSpec {
    override func spec() {
        describe("Console Manager") {
            it("should log messages from the webview") {
                
                waitUntil { done in
                    
                    let doneChecker = GrabLog(doneFunc: done, messageToConfirm: "test message from webview")
                    log.addLogDestination(doneChecker)
                    let hw = HybridWebview(frame: CGRect(x: 0,y: 0,width: 10,height: 10))
                    hw.loadHTMLString("<html><body><script>console.info('test message from webview')</script></body></html>", baseURL: nil)
               
                }
                
            }
        }
    }
}