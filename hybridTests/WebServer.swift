//
//  WebServer.swift
//  hybrid
//
//  Created by alastair.coote on 22/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
@testable import hybrid


class WebServerTests: QuickSpec {
    override func spec() {
        describe("Web Server") {
            it("should map a server request URL to the full service worker URL") {
                let testURL = NSURL(string: "http://localhost:1000/__service_worker/testfile/www.test.com/hello/test.html")!
                
                
                let modified = WebServer.mapServerURLToRequestURL(testURL)
                expect(modified.host).to(equal("www.test.com"))
            }
        }
    }
}