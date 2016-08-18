//
//  WebServer.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import GCDWebServer
import ObjectMapper
import PromiseKit

class WebServer {
    
    var server = GCDWebServer()
    static var current:WebServer? = nil
    
    init() throws {
        
        self.server.addDefaultHandlerForMethod("POST", requestClass: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleRequest);
        
        self.server.addDefaultHandlerForMethod("GET", requestClass: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleRequest);
        
        try server.startWithOptions([GCDWebServerOption_BindToLocalhost: true]);
        
        log.info("Web server started on port " + String(server.port))
    }
    
    func mapRequestURLToServerURL(url:NSURL) -> NSURL {
        let fetchURL = NSURLComponents()
        fetchURL.scheme = "http"
        fetchURL.host = "localhost"
        fetchURL.port = self.port
        fetchURL.path = "/__service_worker/" + url.host!
        if url.port != nil {
            fetchURL.path! += ":" + String(url.port!)
        }
        
        fetchURL.path! += url.path!
        
        fetchURL.query = url.query
        
        return fetchURL.URL!
    }
    
    static func mapServerURLToRequestURL(url:NSURL) -> NSURL {
        
        // Map our localhost URL to the "real" URL we want to request.
        
        // e.g. http://localhost:1234/__service_worker/test-cache/testdomain.com/test.html
        // to   http://testdomain.com/test.html
        
        let hostPortSplit = url.pathComponents![2].componentsSeparatedByString(":")
        

//        Int32(<#T##text: String##String#>)
        let fetchURL = NSURLComponents()
        fetchURL.scheme = "https"
        fetchURL.host = hostPortSplit[0]
        if hostPortSplit.count == 2 {
            fetchURL.port = Int(hostPortSplit[1])
        }
        fetchURL.path = "/" + url.pathComponents!.dropFirst(3).joinWithSeparator("/")
        fetchURL.query = url.query
        return fetchURL.URL!
    }
    
    func handleServiceWorkerRequest(request:GCDWebServerRequest, completionBlock: GCDWebServerCompletionBlock) {
        
        let mappedURL = WebServer.mapServerURLToRequestURL(request.URL)
        
        ServiceWorkerManager.getServiceWorkerForURL(mappedURL)
        .then { (sw) -> Promise<Void> in
            if (sw == nil) {
                log.error("Service worker request that has no valid worker: " + mappedURL.absoluteString)
                
                let response = GCDWebServerErrorResponse(data: "404 NOT FOUND".dataUsingEncoding(NSUTF8StringEncoding), contentType: "text/plain")
                
                response.statusCode = 404
                
                completionBlock(response)
                return Promise<Void>()
            }
            
            
            let fetch = OldFetchRequest()
            fetch.url = WebServer.mapServerURLToRequestURL(request.URL)// fetchURL.URL!
            fetch.method = request.method
            fetch.headers = request.headers as! [String:String]
            
            if fetch.headers["Referrer"] != nil {
                fetch.referrer = NSURL(string: fetch.headers["Referrer"]!)
            }
        
            return sw!.dispatchFetchEvent(fetch)
            .then { response in
            
                
                let gcdresponse = try GCDWebServerDataResponse(data: response.getBody(), contentType: response.getHeader("content-type")!)
                if response.status != nil {
                    gcdresponse.statusCode = response.status!
                } else {
                    gcdresponse.statusCode = 200
                }
                
                for (key, val) in response.getAllHeaders() {
                    gcdresponse.setValue(val as! String, forAdditionalHeader: key)
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
        
        
        let urlToActuallyFetch = WebServer.mapServerURLToRequestURL(request.URL)
        
        log.info("Going to network to fetch: " + urlToActuallyFetch.absoluteString)
        
        
        Promisified.AlamofireRequest(request.method, url: urlToActuallyFetch)
        .then { (r) -> Void in
            let response = GCDWebServerDataResponse(data: r.data, contentType: r.request.valueForHTTPHeaderField("Content-Type"))
            
            for (key, value) in r.response.allHeaderFields {
                response.setValue(value as! String, forAdditionalHeader: key as! String)
            }
            
            completionBlock(response)
        }
    }
    
    func handleRequest(request: GCDWebServerRequest?, completionBlock:GCDWebServerCompletionBlock?) {
        
        if (request!.URL.pathComponents![1] == "__service_worker") {
            // URL is within scope of service worker
            self.handleServiceWorkerRequest(request!, completionBlock: completionBlock!)
            return
        }
        
        self.passRequestThroughToNetwork(request!, completionBlock: completionBlock!)
        
//        
//        
//        log.error("Trying to access a URL we don't handle? " + request!.URL.absoluteString)
//        
//        completionBlock!(GCDWebServerDataResponse(statusCode: 404))
//
//        
//        let dataRequest = request as! GCDWebServerDataRequest;
//        
//        let pathPieces = dataRequest.URL.path!.componentsSeparatedByString("/");
//        log.info("Received request for " + dataRequest.URL.absoluteString);
//        
//        
//        
//        let resp = GCDWebServerDataResponse(JSONObject: ["hello": "yes"])!
//        resp.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin");
//        
//        completionBlock!(resp);
    }
    
    var port:Int {
        get {
            return Int(server.port);
        }
    }
    
    static func initialize() throws {
        GCDWebServer.setLogLevel(2)
        WebServer.current = try WebServer()
    }

}