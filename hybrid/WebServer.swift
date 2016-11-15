//
//  WebServer.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import GCDWebServer
import PromiseKit

class WebServer {
    
    var server = GCDWebServer()
    var chosenPortNumber: Int?
    
    init() throws {
        
        self.server.addDefaultHandlerForMethod("POST", requestClass: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleRequest);
        
        self.server.addDefaultHandlerForMethod("GET", requestClass: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleRequest);
        
        try self.start()
        
    }
    
    func start() throws {
        
        // GCDWebServer has the ability to automatically suspend in the background, but
        // the port will change if we do that. Given that we might have webviews currently
        // sitting on those URLs, we want to keep port numbers consistent.
        //
        // So, we store the number, then handle activation/deactivation ourselves in the
        // AppDelegate
        
        var options: [String: AnyObject] = [
            GCDWebServerOption_BindToLocalhost: true,
            GCDWebServerOption_AutomaticallySuspendInBackground: false
        ]
        
        if self.chosenPortNumber != nil {
            options[GCDWebServerOption_Port] = self.chosenPortNumber!
        }
        
        try server.startWithOptions(options);
        
        self.chosenPortNumber = Int(server.port)

    }
    
    
    func stop() {
        self.server.stop()
    }
    
    
    func handleServiceWorkerRequest(request:GCDWebServerRequest, completionBlock: GCDWebServerCompletionBlock) {
        
        let mappedURL = WebServerDomainManager.mapServerURLToRequestURL(request.URL)
        log.info("Request for " + mappedURL.absoluteString!)
        ServiceWorkerManager.getServiceWorkerWhoseScopeContainsURL(mappedURL)
        .then { (sw) -> Promise<Void> in
            if (sw == nil) {
                
                // We are likely on a domain that has a worker, but not within the scope of that worker.
                
                self.passRequestThroughToNetwork(request, completionBlock: completionBlock)
                return Promise<Void>()
                
            }
            
            
            let fetch = FetchRequest(url: mappedURL.absoluteString!, options: [
                "method": request.method,
                "headers": request.headers as! [String:String]
            ])
            
            fetch.headers.set("host", value: mappedURL.host!)
            
            return sw!.dispatchFetchEvent(fetch)
            .then { maybeResponse -> Promise<FetchResponse> in
                if maybeResponse == nil {
                    return GlobalFetch.fetchRequest(fetch)
                }
                return Promise<FetchResponse>(maybeResponse!)
            }
            .recover { err -> Promise<FetchResponse> in
                log.error(String(err))
                // If fetch event failed, just go to net
                return GlobalFetch.fetchRequest(fetch)
            }
            .then { response in
            
                var contentType:String? = response.headers.get("content-type")
                
                if contentType == nil {
                    contentType = ""
                }
                
                
                let gcdresponse = GCDWebServerDataResponse(data: response.data, contentType: contentType)
                
                gcdresponse.statusCode = response.status
                
                for key in response.headers.keys() {
                    if key.lowercaseString == "content-encoding" {
                        // the body is already ungzipped, so don't do it again
                        continue
                    }
                    gcdresponse.setValue(response.headers.get(key), forAdditionalHeader: key)
                }
                
                completionBlock(gcdresponse)
                return Promise<Void>()
            }
            
           
            
        } .error { (err) -> Void in
            log.error(String(err))
            let errAsNSData = String(err).dataUsingEncoding(NSUTF8StringEncoding)!
            let errorResponse = GCDWebServerDataResponse(data:errAsNSData, contentType: "text/plain")
            errorResponse.statusCode = 500
            completionBlock(errorResponse)

        }
        
    }
    
    func passRequestThroughToNetwork(request: GCDWebServerRequest, completionBlock: GCDWebServerCompletionBlock) {
        
        let urlToActuallyFetch = WebServerDomainManager.mapServerURLToRequestURL(request.URL)
        
        log.info("Going to network to fetch: " + urlToActuallyFetch.absoluteString!)
        
        let fetchRequest = FetchRequest(url: urlToActuallyFetch.absoluteString!, options: [
            "method": request.method
        ])
        
        for (key,val) in request.headers {
            
            if (key as! String).lowercaseString == "host" {
                // We need to rewrite the host header, as it's currently localhost
                fetchRequest.headers.append(key as! String, value: urlToActuallyFetch.host!)
            } else {
                fetchRequest.headers.append(key as! String, value: val as! String)
            }
            
        }
        
        GlobalFetch.fetchRequest(fetchRequest)
        .then { response -> Void in
            
            let gcdResponse = GCDWebServerDataResponse(data: response.data, contentType: response.headers.get("content-type"))
            gcdResponse.statusCode = response.status
            
            for key in response.headers.keys() {
                let value = response.headers.get(key)
                log.info(key + " : " + value!)
                gcdResponse.setValue(value!, forAdditionalHeader: key)
            }
            
            completionBlock(gcdResponse)
            
        }
        
    }
    
//    static func checkServerURLForReferrer(url: NSURL, referrer:String?) -> NSURL {
//        
//        if url.pathComponents?.count > 1 && url.pathComponents![1] == "__service_worker" {
//            // we're already OK
//            return url
//        }
//        
//        if referrer == nil {
//            // No referrer, nothing we can do anyway
//            return url
//        }
//        
//        var originalPath = url.path!
//        
//        if url.absoluteString!.hasSuffix("/") && originalPath.hasSuffix("/") == false {
//            // NSURL strips this out and I don't know why. Very annoying.
//            
//            originalPath += "/"
//        }
//        
//        let referrerURL = NSURL(string: referrer!)
//        
//        if referrerURL?.pathComponents?.count < 2 || referrerURL?.pathComponents?[1] != "__service_worker" {
//            // isn't a service worker URL, so we can't map it
//            return url
//        }
//        
//        let redirectComponents = NSURLComponents(URL: referrerURL!, resolvingAgainstBaseURL: false)!
//        
//        let pathComponents:[String] = [
//            referrerURL!.pathComponents![0], // /
//            referrerURL!.pathComponents![1], // __service_worker
//            "/",
//            referrerURL!.pathComponents![2], // [hostname]
//            originalPath
//        ]
//        
//        
//        redirectComponents.path = pathComponents.joinWithSeparator("")
//        
//        return redirectComponents.URL!
//
//    }
    
//    func webviewBridge(request: GCDWebServerRequest, completionBlock: GCDWebServerCompletionBlock) {
//        
//        if request.URL.path! == "/__activeWebviews" {
//            // We need to be able to communicate with the notification process and tell it
//            // which webviews we have active. To do this, we bundle up the WebviewRecord
//            // into an NSData blob and send it over HTTP. Which feels kind of messy, but it
//            // is easier than creating yet another communication channel.
//            
//            let records = HybridWebview.getActiveWebviewInfo()
//            let encodedAsData = NSKeyedArchiver.archivedDataWithRootObject(records)
//            let response = GCDWebServerDataResponse(data: encodedAsData, contentType: "application/octet-stream")
//            completionBlock(response)
//        } else if request.URL!.pathComponents?.count == 3 {
//            let activeWebviewID = Int(request.URL!.pathComponents![2])!
//            let webview = HybridWebview.getActiveWebviewAtIndex(activeWebviewID)
//            let dataRequest = request as! GCDWebServerDataRequest
//            let j = dataRequest.jsonObject
//            
//            let numberOfPorts = j["numberOfPorts"] as! Int
//            
//            webview.serviceWorkerAPI!.sendEventAwaitResponse("postMessage", arguments: [j["message"] as! String, String(numberOfPorts)])
//            .then { response -> Void in
//                let portResponses = try NSJSONSerialization.dataWithJSONObject(response, options: NSJSONWritingOptions())
//                let dataResponse = GCDWebServerDataResponse(data: portResponses, contentType: "application/json")
//                completionBlock(dataResponse)
//                
//            }
//            .error { err in
//                log.error(String(err))
//            }
//        }
//    }
    
    func handleRequest(request: GCDWebServerRequest?, completionBlock:GCDWebServerCompletionBlock?) {
        log.info("Request for " + request!.URL.absoluteString!)
        
        if request!.URL.path! == "/__placeholder" {
            self.respondWithPlaceholder(completionBlock!);
            return
        }
        
        
        self.handleServiceWorkerRequest(request!, completionBlock: completionBlock!)
    }
    
    func respondWithPlaceholder(completionBlock:GCDWebServerCompletionBlock) {
        // The placeholder we load in webviews when we're waiting for their final content
        
        let template = "<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1,user-scalable=no\" /></head><body><div style='background:red;position:absolute; top:0;left:0;width:100%;height:100%;padding-bottom:50px'>Hello</div></body></html>"
        
        let resp = GCDWebServerDataResponse(data: template.dataUsingEncoding(NSUTF8StringEncoding), contentType: "text/html")
        completionBlock(resp)
    }
    
    var port:Int {
        get {
            return Int(server.port);
        }
    }
    

}
