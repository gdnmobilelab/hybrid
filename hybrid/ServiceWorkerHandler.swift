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
    
    func handleOptions(request: GCDWebServerRequest!) -> GCDWebServerResponse {
        let response = GCDWebServerResponse(statusCode: 200)!;
        
        response.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin");
        response.setValue(request.headers["Access-Control-Request-Headers"] as! String, forAdditionalHeader: "Access-Control-Allow-Headers");
        return response;
    }
    
    func handleRequest(request: GCDWebServerRequest?, completionBlock:GCDWebServerCompletionBlock?) {
        
        let dataRequest = request as! GCDWebServerDataRequest;
        
        let pathPieces = dataRequest.URL.path!.componentsSeparatedByString("/");
        log.info("Received request for " + dataRequest.URL.absoluteString);
        
        
        
        let resp = GCDWebServerDataResponse(JSONObject: ["hello": "yes"])!
        resp.setValue("*", forAdditionalHeader: "Access-Control-Allow-Origin");
        
        completionBlock!(resp);
    }
    
    init() throws {
        GCDWebServer.setLogLevel(2);
        webServer = GCDWebServer();
        
        webServer.addDefaultHandlerForMethod("POST", requestClass: GCDWebServerDataRequest.self, asyncProcessBlock:self.handleRequest);
        // webServer.addDefaultHandlerForMethod("OPTIONS", requestClass: GCDWebServerRequest.self, processBlock: self.handleOptions);
        
        try webServer.startWithOptions([GCDWebServerOption_BindToLocalhost: true]);
        
        //        webServer.addDefaultHandler(forMethod: "POST", request: GCDWebServerDataRequest.self) { (GCDWebServerRequest?, GCDWebServerCompletionBlock?) in
        //            code
        //        }    }
        
    }
    
    
    
    var webServerPort:UInt {
        get {
            return webServer.port;
        }
    }
}
