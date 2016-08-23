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
import GCDWebServer
@testable import hybrid


class WebServerTests: QuickSpec {
    override func spec() {
        

        describe("Web Server") {
            
            beforeEach {
                do {
                    try Db.mainDatabase.inDatabase({ (db) in
                        NSLog("Clearing service workers before test...")
                        try db.executeUpdate("DELETE FROM service_workers", values: [])
                    })
                } catch {
                    expect(error).to(beNil())
                }
            }
            
            
            it("should map a server request URL to the full service worker URL") {
                let testURL = NSURL(string: "http://localhost:1000/__service_worker/www.test.com/hello/test.html")!
                
                
                let modified = WebServer.mapServerURLToRequestURL(testURL)
                expect(modified.host).to(equal("www.test.com"))
            }
            
            it("should map a server request URL with port to the full service worker URL") {
                let testURL = NSURL(string: "http://localhost:1000/__service_worker/www.test.com:3124/hello/test.html")!
                
                
                let modified = WebServer.mapServerURLToRequestURL(testURL)
                expect(modified.host).to(equal("www.test.com"))
                expect(modified.port).to(equal(3124))
                expect(modified.absoluteString).to(equal("https://www.test.com:3124/hello/test.html"))
            }
            
            it("should map a server request URL with port to the full service worker URL") {
            
                let filePath = TestUtil.getFilePath("test-workers/test-fetch-event.js")
                
                waitUntil { done in
                    ServiceWorkerManager.insertServiceWorkerIntoDB(NSURL(string:"https://test.local/test.js")!, scope: NSURL(string: "https://test.local")!, lastModified: 1, js: NSData(contentsOfFile: filePath)!, installState: ServiceWorkerInstallState.Activated)
                        
                        .then { (_) -> Promise<AlamofireResponse> in
                            let serverMappedURL = WebServer.current!.mapRequestURLToServerURL(NSURL(string:"https://test.local/test.html")!)
                            
                            return Promisified.AlamofireRequest("GET", url: serverMappedURL)
                            
                        }
                        .then {(r) -> Void in
                            let responseAsText = String(data: r.data!, encoding: NSUTF8StringEncoding)
                            expect(responseAsText).to(equal("DO NOT KNOW THIS"))
                            
                        }
                        
                        .then { (_) -> Promise<AlamofireResponse> in
                            let serverMappedURL = WebServer.current!.mapRequestURLToServerURL(NSURL(string:"https://test.local/fetch-this-url.html")!)
                            
                            return Promisified.AlamofireRequest("GET", url: serverMappedURL)
                            
                        }
                        .then {(r) -> Void in
                            let responseAsText = String(data: r.data!, encoding: NSUTF8StringEncoding)
                            expect(responseAsText).to(equal("FETCHED THIS"))
                            done()
                            
                        }
                        .error { err in
                            expect(err).to(beNil())
                            done()
                    }
                    
                }
            }
        }
        
        
    }
}