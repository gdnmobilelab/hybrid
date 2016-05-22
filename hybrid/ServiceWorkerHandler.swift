//
//  WebServer.swift
//  hybrid
//
//  Created by Alastair Coote on 4/30/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import GCDWebServer

class ServiceWorkerHandler {
    
    var webServer:GCDWebServer;
    
    init() throws {
        GCDWebServer.setLogLevel(2);
        webServer = GCDWebServer();
        webServer.addDefaultHandlerForMethod("POST", requestClass: GCDWebServerDataRequest.self, asyncProcessBlock: self.handleRequest);
        webServer.addDefaultHandlerForMethod("OPTIONS", requestClass: GCDWebServerRequest.self, processBlock: self.handleOptions);
        try webServer.startWithOptions([GCDWebServerOption_BindToLocalhost: true]);
    }
    
    func handleOptions(request: GCDWebServerRequest!) -> GCDWebServerResponse! {
        let response = GCDWebServerResponse(statusCode: 200);
        response.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin");
        response.setValue(request.headers["Access-Control-Request-Headers"] as! String, forAdditionalHeader: "Access-Control-Allow-Headers");
        return response;
    }
    
    func handleRequest(request: GCDWebServerRequest!, completionBlock:GCDWebServerCompletionBlock!) {
        log.debug("Received request for " + request.URL.absoluteString);
     
        let dataRequest = request as! GCDWebServerDataRequest;
        
        let pathPieces = request.URL.path!.componentsSeparatedByString("/");
        
        
        if (pathPieces[1] == "sw" && pathPieces[2] == "register") {
            let jsonString = NSString(data: dataRequest.data, encoding: NSUTF8StringEncoding)! as String;
            let register = try? ServiceWorkerRegisterRequest(JSONString: jsonString);
            
            
            
            log.info("PATH IS" + register!.url);
        }
        
        let resp = GCDWebServerDataResponse(JSONObject: ["hello": "yes"])
        resp.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin");
        
        completionBlock(resp);
    }
    
    var webServerPort:UInt {
        get {
            return webServer.port;
        }
    }
}
