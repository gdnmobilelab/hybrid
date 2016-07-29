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
        
        try server.startWithOptions([GCDWebServerOption_BindToLocalhost: true]);
        
        log.info("Web server started on port " + String(server.port))
    }
    
    static func mapServerURLToRequestURL(url:NSURL) -> NSURL {
        let fetchURL = NSURLComponents()
        fetchURL.scheme = "https"
        fetchURL.host = url.pathComponents![3]
        fetchURL.path = "/" + url.pathComponents!.dropFirst(4).joinWithSeparator("/")
        fetchURL.query = url.query
        return fetchURL.URL!
    }
    
    func handleServiceWorkerRequest(request:GCDWebServerRequest, completionBlock: GCDWebServerCompletionBlock) {
        
        ServiceWorkerManager.getServiceWorkerForURL(request.URL)
        .then { (sw) -> Promise<Bool> in
            if (sw == nil) {
                log.error("Service worker request that has no scope: " + request.URL.absoluteString)
                completionBlock(GCDWebServerDataResponse(statusCode: 404))
                return Promise<Bool>(false)
            }
            
            // Map our localhost URL to the "real" URL we want to request.
            
            // e.g. http://localhost:1234/testdomain.com/test.html
            // to   http://testdomain.com/test.html
            
            let fetchURL = NSURLComponents()
            fetchURL.scheme = "https"
            fetchURL.host = request.URL.pathComponents![2]
            fetchURL.path = request.URL.pathComponents!.dropFirst(3).joinWithSeparator("/")
            fetchURL.query = request.URL.query
            
            let fetch = FetchRequest()
            fetch.url = fetchURL.URL!
            fetch.method = request.method
            fetch.headers = request.headers as! [String:String]
            
            if fetch.headers["Referrer"] != nil {
                fetch.referrer = NSURL(string: fetch.headers["Referrer"]!)
            }
        
            return sw!.dispatchFetchEvent(fetch)
            .then { response in
                let gcdresponse = GCDWebServerDataResponse(data: response.getBody(), contentType: response.getHeader("content-type"))
                gcdresponse.statusCode = response.status
                completionBlock(gcdresponse)
                return Promise<Bool>(true)
            }
           
            
        } .error { err in
            log.error(String(err))
            let errAsNSData = String(err).dataUsingEncoding(NSUTF8StringEncoding)!
            let errorResponse = GCDWebServerDataResponse(data:errAsNSData, contentType: "text/plain")
            errorResponse.statusCode = 500
            completionBlock(errorResponse)
        }
        
    }
    
    func handleRequest(request: GCDWebServerRequest?, completionBlock:GCDWebServerCompletionBlock?) {
        
        if (request!.URL.pathComponents![1] == "__service_worker") {
            self.handleServiceWorkerRequest(request!, completionBlock: completionBlock!)
            return
        }
        
        log.error("Trying to access a URL we don't handle? " + request!.URL.absoluteString)
        
        completionBlock!(GCDWebServerDataResponse(statusCode: 404))
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