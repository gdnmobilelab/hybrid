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
    
    func isLocalServerURL(url:NSURL) -> Bool {
        return url.host! == "localhost" && url.port! == self.port
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
        
        
        var path = url.path!
        
        // for some reason NSURL strips trailing slashes. Grr.
        // http://www.cocoabuilder.com/archive/cocoa/316298-nsurl-path-if-the-path-has-trailing-slash-it-is-stripped.html
        
        if url.absoluteString!.hasSuffix("/")  && path.hasSuffix("/") == false {
            path += "/"
        }
        
        fetchURL.path! += path
        
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
        if hostPortSplit[0] == "localhost" {
            // just for testing, really
            fetchURL.scheme = "http"
        } else {
            fetchURL.scheme = "https"
        }
        
        fetchURL.host = hostPortSplit[0]
        if hostPortSplit.count == 2 {
            fetchURL.port = Int(hostPortSplit[1])
        }
        fetchURL.path = "/" + url.pathComponents!.dropFirst(3).joinWithSeparator("/")
        
        if url.absoluteString!.hasSuffix("/") && fetchURL.path!.hasSuffix("/") == false {
            fetchURL.path! += "/"
        }
        
        fetchURL.query = url.query
        return fetchURL.URL!
    }
    
    func handleServiceWorkerRequest(request:GCDWebServerRequest, completionBlock: GCDWebServerCompletionBlock) {
        
        let mappedURL = WebServer.mapServerURLToRequestURL(request.URL)
        log.info("Request for " + request.URL.absoluteString!)
        ServiceWorkerManager.getServiceWorkerForURL(mappedURL)
        .then { (sw) -> Promise<Void> in
            if (sw == nil) {
                log.error("Service worker request that has no valid worker: " + mappedURL.absoluteString!)
                
                let response = GCDWebServerErrorResponse(data: "404 NOT FOUND".dataUsingEncoding(NSUTF8StringEncoding), contentType: "text/plain")
                
                response.statusCode = 404
                
                completionBlock(response)
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
        
        
        let urlToActuallyFetch = WebServer.mapServerURLToRequestURL(request.URL)
        
        log.info("Going to network to fetch: " + urlToActuallyFetch.absoluteString!)
        
        
        Promisified.AlamofireRequest(request.method, url: urlToActuallyFetch)
        .then { (r) -> Void in
            let response = GCDWebServerDataResponse(data: r.data, contentType: r.request.valueForHTTPHeaderField("Content-Type"))
            
            for (key, value) in r.response.allHeaderFields {
                response.setValue(value as! String, forAdditionalHeader: key as! String)
            }
            
            completionBlock(response)
        }
    }
    
    static func checkServerURLForReferrer(url: NSURL, referrer:String?) -> NSURL {
        
        if url.pathComponents?.count > 1 && url.pathComponents![1] == "__service_worker" {
            // we're already OK
            return url
        }
        
        if referrer == nil {
            // No referrer, nothing we can do anyway
            return url
        }
        
        var originalPath = url.path!
        
        if url.absoluteString!.hasSuffix("/") && originalPath.hasSuffix("/") == false {
            // NSURL strips this out and I don't know why. Very annoying.
            
            originalPath += "/"
        }
        
        let referrerURL = NSURL(string: referrer!)
        
        if referrerURL?.pathComponents?.count < 2 || referrerURL?.pathComponents?[1] != "__service_worker" {
            // isn't a service worker URL, so we can't map it
            return url
        }
        
        let redirectComponents = NSURLComponents(URL: referrerURL!, resolvingAgainstBaseURL: false)!
        
        let pathComponents:[String] = [
            referrerURL!.pathComponents![0], // /
            referrerURL!.pathComponents![1], // __service_worker
            "/",
            referrerURL!.pathComponents![2], // [hostname]
            originalPath
        ]
        
        
        redirectComponents.path = pathComponents.joinWithSeparator("")
        
        return redirectComponents.URL!

    }
    
    func handleRequest(request: GCDWebServerRequest?, completionBlock:GCDWebServerCompletionBlock?) {
        log.info("Request for " + request!.URL.absoluteString!)
        
        
        let checkedURL = WebServer.checkServerURLForReferrer(request!.URL, referrer: request!.headers["Referer"] as? String)
        
        if checkedURL != request!.URL {
            
            // A service worker has requested a URL from /, which wipes out our domain info. So we forward it.

            log.info("Redirecting from " + request!.URL.absoluteString! + " to " + checkedURL.absoluteString!)
            
            completionBlock!(GCDWebServerResponse(redirect: checkedURL, permanent: false))
            return
        }
        
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
