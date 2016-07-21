//
//  WebServer.swift
//  hybrid
//
//  Created by alastair.coote on 14/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import GCDWebServer

class WebServer {
    
    var server = GCDWebServer()
    static var current:WebServer? = nil
    
    init() throws {
        try server.startWithOptions([GCDWebServerOption_BindToLocalhost: true]);
        
        self.server.addDefaultHandlerForMethod("POST", requestClass: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleRequest);
        
        log.info("Web server started on port " + String(server.port))
    }
    
    func handleServiceWorkerRequest(request:GCDWebServerRequest, completionBlock: GCDWebServerCompletionBlock) {
        
        ServiceWorkerManager.getServiceWorkerForURL(request.URL)
        .then { (sw) -> Void in
            if (sw == nil) {
                log.error("Service worker request that has no scope: " + request.URL.absoluteString)
                completionBlock(GCDWebServerDataResponse(statusCode: 404))
                return
            }
            
            sw!.
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