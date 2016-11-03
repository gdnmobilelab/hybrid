//
//  WebServerDomainManager.swift
//  hybrid
//
//  Created by alastair.coote on 01/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

struct URLHostAndPort : Hashable, Equatable {
    var host:String
    var scheme:String
    var port:Int?
    
    var hashValue: Int {
        get {
            var value = host.hashValue
            
            if let portValue = port?.hashValue {
                value ^= portValue
            }
            
            return value
        }
    }
    
    init(scheme:String, host: String, port: NSNumber?) {
        self.scheme = scheme
        self.host = host
        self.port = port as? Int
    }
    
}

func ==(one:URLHostAndPort, two: URLHostAndPort) -> Bool {
    return one.host == two.host && one.port == two.port
}

class WebServerDomainManager {
    private static var domainServerMap = [URLHostAndPort:WebServer]()
    
    static func rewriteURLIfInWorkerDomain(url:NSURL) -> NSURL {
        
        if url.host == "localhost" {
            // Is already a mapped URL
            return url
        }
        
        let withoutPath = NSURLComponents(URL: url, resolvingAgainstBaseURL: true)!
        withoutPath.path = "/"
        
        var workersExistForThisDomain = false
        
        do {
            try Db.mainDatabase.inDatabase { db in
                
                let resultSet = try db.executeQuery("SELECT COUNT(*) as worker_count FROM service_workers WHERE url LIKE (? || '%') AND NOT install_state = ?", values: [withoutPath.URL!.absoluteString!, ServiceWorkerInstallState.Redundant.rawValue])
                
                resultSet.next()
                
                if resultSet.intForColumn("worker_count") > 0 {
                    workersExistForThisDomain = true
                }
                
                resultSet.close()
                
            }
        } catch {
            log.error("Could not check whether URL was in a worker domain: " + url.absoluteString! + " / " + String(error))
        }
        
        if workersExistForThisDomain == false {
            
            // If we don't have any workers for this domain then there's no need to spin up
            // a server just to pass through to network every time
            
            return url
        }
        
        do {
            return try mapRequestURLToServerURL(url)
        } catch {
            log.error("Could not map request URL to server? " + url.absoluteString!)
            return url
        }
        
    }
    
    static func stopAll() {
        self.domainServerMap.forEach {key, server in
            server.stop()
        }
    }
    
    static func startAll() throws {
        try self.domainServerMap.forEach {key, server in
            try server.start()
        }
    }
    
    private static func getForDomain(domain:NSURL) throws -> WebServer {
        
        let key = URLHostAndPort(scheme: domain.scheme!, host: domain.host!, port: domain.port)
        
        if let existingServer = domainServerMap[key] {
            return existingServer
        }
        
        let newServer = try WebServer()
        domainServerMap[key] = newServer
        
        log.info("Web server started on port " + String(newServer.port) + " for domain " + domain.host!)
        
        return newServer
    }
    
    static private func mapRequestURLToServerURL(requestURL:NSURL) throws -> NSURL {
        
        // To convert a normal URL, for example:
        // http://www.theguardian.co.uk/test.html
        // to:
        // http://localhost:23423/test.html
        
        let components = NSURLComponents(URL: requestURL, resolvingAgainstBaseURL: true)!
        
        let server = try getForDomain(requestURL)
        
        components.host = "localhost"
        components.port = server.port
        
        // using localhost so we can't serve over HTTPS
        components.scheme = "http"
        
        return components.URL!
        
    }
    
    static func mapServerURLToRequestURL(serverURL:NSURL) -> NSURL {
        
        // And do the reverse.
        
        let components = NSURLComponents(URL:serverURL, resolvingAgainstBaseURL: true)!
        
        let serverBeingUsed = self.domainServerMap
            .filter { (key, server) in
                return server.port == serverURL.port!
            }
            .first!.0
        
        components.host = serverBeingUsed.host
        components.port = serverBeingUsed.port
        components.scheme = serverBeingUsed.scheme
        
        return components.URL!
        
    }
    
    static func isLocalServerURL(maybeServerURL:NSURL) -> Bool {
        return maybeServerURL.host == "localhost"
    }
}
