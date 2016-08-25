//
//  TestUtil.swift
//  hybrid
//
//  Created by alastair.coote on 05/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import GCDWebServer

@testable import hybrid


class TestUtil {
    static func makeTestWebServer(directoryName:String, port:Int? = nil) -> GCDWebServer {
        let bundle = NSBundle(forClass: TestUtil.self)

        let base = NSURL(fileURLWithPath: bundle.resourcePath!)
        let directory = base.URLByAppendingPathComponent(directoryName)
        NSLog(directory!.path!)
        
        let gcdWeb = GCDWebServer()
        gcdWeb.addGETHandlerForBasePath("/", directoryPath: directory!.path, indexFilename: "index.html", cacheAge: 0, allowRangeRequests: false)
        
        if port != nil {
            gcdWeb.startWithPort(UInt(port!), bonjourName: nil)
        } else {
            gcdWeb.start()
        }
        return gcdWeb
    }
    
    static func clearServiceWorkers() {
        do {
            log.info("Clearing service workers...")
            ServiceWorkerManager.clearActiveServiceWorkers()
            try Db.mainDatabase.inDatabase({ (db) in
                try db.executeUpdate("DELETE FROM service_workers", values: [])
            })
        } catch {
            //expect(error).to(beNil())
        }
    }
    
    static func clearServiceWorkerCache() {
        do {
            try Db.mainDatabase.inDatabase({ (db) in
                try db.executeUpdate("DELETE FROM cache", values: [])
            })
        } catch {
            //expect(error).to(beNil())
        }
    }
    
    static func getFilePath(path:String) -> String {
        
        let bundle = NSBundle(forClass: TestUtil.self)
       

        // can't work out how to get directory path. So we get file path first
        
        let fileURL = NSURL(fileURLWithPath: path)
        let filePath = bundle.pathForResource(fileURL.URLByDeletingPathExtension!.lastPathComponent!, ofType: fileURL.pathExtension!, inDirectory: fileURL.URLByDeletingLastPathComponent!.path)!
        
        return filePath
    }
}
