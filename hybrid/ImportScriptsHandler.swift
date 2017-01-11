//
//  ImportScriptsHandler.swift
//  hybrid
//
//  Created by alastair.coote on 11/01/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit

class ImportScriptsHandler {
    
    let serviceWorker:ServiceWorkerInstance
    
    init(serviceWorker:ServiceWorkerInstance) {
        self.serviceWorker = serviceWorker
    }
    
    func fetchFromDBOrDownload(url:URL) -> Promise<FetchResponse> {
        return Promise(value: FetchResponse(body: "console.log('hi');", options: nil))
        return GlobalFetch.fetch(url.absoluteString)
        .then { response in
            return response
        }
    }
    
    func importScriptsFromArray(urls: [String]) -> [String] {
        var jsStrings = [String]()

        self.serviceWorker.dispatchQueue.sync {
            
        
        let urlsRelativeToWorkerURL = urls.map { URL(string: $0, relativeTo: self.serviceWorker.url)! }
        let isMain = Thread.isMainThread
        log.info("IS MAIN" + String(isMain))
        // We use a dispatch group to force the thread to wait for our promises to execute.
//        let dispatchGroup = DispatchGroup()
//
//        dispatchGroup.enter()
//        
        
//
//       
//        let importThread = DispatchQueue(label: "import-scripts")
//        importThread.async {
//            
//            let downloadPromises = urlsRelativeToWorkerURL.map { self.fetchFromDBOrDownload(url: $0) }
//            
//            when(fulfilled: downloadPromises)
//            .then(on: importThread, execute: { responses -> Void in
//                
//                responses
//                    .map { String(data: $0.data!, encoding: String.Encoding.utf8)! }
//                    .forEach { jsStrings.append($0)}
//                log.info("Waiting....")
//                importThread.asyncAfter(deadline: DispatchTime.now() + (10), execute: {
//                    dispatchGroup.leave()
//                })
//                
//                
//            })
//            .catch { err in
//                NSLog("wtf")
//            }
//            
//        }
//
//        _ = dispatchGroup.wait(timeout: DispatchTime.distantFuture)
        
        log.info("Sleeping...")
        
        Thread.sleep(forTimeInterval: 10)
        log.info("Waking up...")
            }
        return jsStrings
    }
}
