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


/// A wrapper around GCDWebServer (https://github.com/swisspol/GCDWebServer). An instance is spun up for each origin (i.e. domain)
/// we have a service worker running on. We use this server to pipe HTTP requests through worker fetch events when applicable.
class WebServer {
    
    fileprivate var server = GCDWebServer()
    
    
    /// We store the port number that GCDWebServer decides on when it first starts up, so that when the app suspends and resumes
    /// we can make sure that it is using the correct port.
    var chosenPortNumber: Int?
    
    init() throws {
        
        self.server?.addDefaultHandler(forMethod: "POST", request: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleServiceWorkerRequest)
        self.server?.addDefaultHandler(forMethod: "GET", request: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleServiceWorkerRequest)
        self.server?.addDefaultHandler(forMethod: "HEAD", request: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleServiceWorkerRequest)
        
        try self.start()
        
    }
    
    /// GCDWebServer has the ability to automatically suspend in the background, but
    /// the port will change if we do that. Given that we might have webviews currently
    /// sitting on those URLs, we want to keep port numbers consistent.
    ///
    /// So, we store the number in self.chosenPortNumber, then handle activation/deactivation ourselves in the
    /// AppDelegate.
    func start() throws {
        
        var options: [String: AnyObject] = [
            GCDWebServerOption_BindToLocalhost: true as AnyObject,
            GCDWebServerOption_AutomaticallySuspendInBackground: false as AnyObject
        ]
        
        if self.chosenPortNumber != nil {
            options[GCDWebServerOption_Port] = self.chosenPortNumber! as AnyObject?
        }
        
        try server?.start(options: options);
        
        self.chosenPortNumber = Int((server?.port)!)

    }
    
    
    /// Shut down the server
    func stop() {
        self.server?.stop()
    }
    
    
    /// This takes the HTTP request from our WKWebView and transforms it into a service worker fetch request,
    /// if we are in the scope of one. If not, passes along to self.passRequestThroughToNetwork()
    ///
    /// - Parameters:
    ///   - request: The request being sent
    ///   - completionBlock: The GCD async execution block that allows us to send a response back
    func handleServiceWorkerRequest(_ request:GCDWebServerRequest?, completionBlock: GCDWebServerCompletionBlock?) {
        
        let mappedURL = WebServerDomainManager.mapServerURLToRequestURL(request!.url)
        log.info("Request for " + mappedURL.absoluteString!)
        ServiceWorkerManager.getServiceWorkerWhoseScopeContainsURL(mappedURL)
        .then { (sw) -> Promise<Void> in
            if (sw == nil) {
                
                // We are likely on a domain that has a worker, but not within the scope of that worker.
                
                self.passRequestThroughToNetwork(request!, completionBlock: completionBlock!)
                return Promise<Void>()
                
            }
            
            
            let fetch = FetchRequest(url: mappedURL.absoluteString!, options: [
                "method": request!.method,
                "headers": request!.headers as! [String:String]
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
                
                completionBlock!(gcdresponse)
                return Promise<Void>()
            }
            
           
            
        } .error { (err) -> Void in
            log.error(String(err))
            let errAsNSData = String(err).dataUsingEncoding(NSUTF8StringEncoding)!
            let errorResponse = GCDWebServerDataResponse(data:errAsNSData, contentType: "text/plain")
            errorResponse.statusCode = 500
            completionBlock!(errorResponse)

        }
        
    }
    
    
    /// If our request is outside the scope of a service worker, we will pass it onto the outside network.
    /// This requires rewriting the Host header, and rewriting the request URL.
    ///
    /// - Parameters:
    ///   - request: The request we've detected to be outside of worker scope
    ///   - completionBlock: The async block that lets us return content
    func passRequestThroughToNetwork(_ request: GCDWebServerRequest, completionBlock: @escaping GCDWebServerCompletionBlock) {
        
        let urlToActuallyFetch = WebServerDomainManager.mapServerURLToRequestURL(request.url)
        
        log.info("Going to network to fetch: " + urlToActuallyFetch.absoluteString!)
        
        let fetchRequest = FetchRequest(url: urlToActuallyFetch.absoluteString!, options: [
            "method": request.method
        ])
        
        for (key,val) in request.headers {
            
            if (key as! String).lowercased() == "host" {
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
    
//    func handleRequest(request: GCDWebServerRequest?, completionBlock:GCDWebServerCompletionBlock?) {
//        log.info("Request for " + request!.URL.absoluteString!)
//        
//        if request!.URL.path! == "/__placeholder" {
//            self.respondWithPlaceholder(completionBlock!);
//            return
//        }
//        
//        
//        self.handleServiceWorkerRequest(request!, completionBlock: completionBlock!)
//    }
//    
//    func respondWithPlaceholder(completionBlock:GCDWebServerCompletionBlock) {
//        // The placeholder we load in webviews when we're waiting for their final content
//        
//        let template = "<html><head><meta name=\"viewport\" content=\"width=device-width, initial-scale=1,user-scalable=no\" /></head><body><div style='background:red;position:absolute; top:0;left:0;width:100%;height:100%;padding-bottom:50px'>Hello</div></body></html>"
//        
//        let resp = GCDWebServerDataResponse(data: template.dataUsingEncoding(NSUTF8StringEncoding), contentType: "text/html")
//        completionBlock(resp)
//    }
    
    var port:Int {
        get {
            return Int(server!.port)
        }
    }
    

}
