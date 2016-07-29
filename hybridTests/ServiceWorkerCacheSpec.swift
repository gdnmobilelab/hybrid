//
//  ServiceWorkerCacheSpec.swift
//  hybrid
//
//  Created by alastair.coote on 28/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Quick
import Nimble
import PromiseKit
import JavaScriptCore
import GCDWebServer

@testable import hybrid


class ServiceWorkerCacheSpec: QuickSpec {
    
    override func spec() {
        
        var gcdWeb:GCDWebServer?
        
        beforeSuite {
            
            let bundle = NSBundle(forClass: ServiceWorkerCacheSpec.self)
            
            // can't work out how to get directory path. So we get file path first
            
            let filePath = bundle.pathForResource("text-file", ofType: "txt", inDirectory: "cache-test-data")!
            
            let fileURL = NSURL(string: filePath)
            
            // now remove last URL component
            let directoryPath = fileURL!.URLByDeletingLastPathComponent?.absoluteString
            

            gcdWeb = GCDWebServer()
            gcdWeb!.addGETHandlerForBasePath("/", directoryPath: directoryPath, indexFilename: "index.html", cacheAge: 0, allowRangeRequests: false)
            
            
            gcdWeb!.start()
            
            do {
                try Db.mainDatabase.inDatabase({ (db) in
                    try db.executeUpdate("DELETE FROM cache", values: [])
                })
            } catch {
                expect(error).to(beNil())
            }
        }
        
        afterSuite { 
            gcdWeb!.stop()
            
            
        }
        
        it("should store a cache entry and return both match and response") {
            
            let dummySWURL = NSURLComponents(string: "http://localhost/sw.js")!
            dummySWURL.port = gcdWeb!.port
            
            
            waitUntil { done in
                
                Promise<Void>()
                .then { () -> Promise<Void> in
                    let cache = try ServiceWorkerCache(swURL: dummySWURL.URL!, cacheName: "test-cache")
                    return cache.addAll(["/text-file.txt"])
                    .then { _ in
                        
                        let fileToGet = NSURLComponents(string: dummySWURL.URL!.absoluteString)!
                        
                        fileToGet.path = "/text-file.txt"
                       
                        return cache.match(fileToGet.URL!)
                        .then { (response) -> Promise<Void> in
                            expect(response).notTo(beNil())
                            
                            // Now let's get the actual response to check
                            
                            let responseObject = try ServiceWorkerCache.getResponse(fileToGet.URL!.absoluteString, serviceWorkerURL: dummySWURL.URL!.absoluteString, cacheId: "test-cache")
                            
                            expect(String(data: responseObject!.response, encoding: NSUTF8StringEncoding)).to(equal("THIS IS TEXT"))

                            return Promise<Void>()
                        }
                        
                    }

                }
                .then {
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