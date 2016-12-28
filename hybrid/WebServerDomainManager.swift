//
//  WebServerDomainManager.swift
//  hybrid
//
//  Created by alastair.coote on 01/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation


/// Struct used in the WebServerDomainManager as a key to store WebServer instances.
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


/// We create a new WebServer for every domain that has service workers on it - this allows us to relatively
/// seamlessly map domains from their real address to localhost:<random port number>. These port numbers do not
/// persist though, which means things like LocalStorage disappear between app loads. Which isn't ideal.
class WebServerDomainManager {
    fileprivate static var domainServerMap = [URLHostAndPort:WebServer]()
    
    
    /// If the provided URL is within a domain used by a service worker, return a mapped version of the URL
    /// that'll load the page locally. This involes a DB call, which it probably shouldn't. Future optimisation
    /// will be to keep a simple track of this in memory instead.
    ///
    /// - Parameter url: The URL to check
    /// - Returns: If the URL is not in a service worker domain, it will return the same URL. Otherwise, a localhost-mapped one.
    static func rewriteURLIfInWorkerDomain(_ url:URL) -> URL {
        
        if url.host == "localhost" {
            // Is already a mapped URL
            return url
        }
        
        var withoutPath = URLComponents(url: url, resolvingAgainstBaseURL: true)!
        withoutPath.path = "/"
        withoutPath.query = nil
        
        let domain = withoutPath.url!.absoluteString
        
        var workersExistForThisDomain = false
        
        do {
            try Db.mainDatabase.inDatabase { db in
                
                let resultSet = try db.executeQuery("SELECT COUNT(*) as worker_count FROM service_workers WHERE url LIKE (? || '%') AND NOT install_state = ?", values: [domain, ServiceWorkerInstallState.redundant.rawValue])
                
                resultSet.next()
                
                let numberOfWorkers = resultSet.int(forColumn: "worker_count")
                
                if numberOfWorkers > 0 {
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
    
    
    /// Stop all servers. Used when the app goes into background mode.
    static func stopAll() {
        self.domainServerMap.forEach {key, server in
            server.stop()
        }
    }
    
    
    /// Start servers back up again. Used when the app resumes from background mode.
    ///
    /// - Throws: If the servers cannot be restarted for some reason
    static func startAll() throws {
        try self.domainServerMap.forEach {key, server in
            try server.start()
        }
    }
    
    
    /// - Parameter domain: An NSURL containing the domain you want the web server for
    /// - Returns: The web server for this domain. If one does not exist, it starts one
    /// - Throws: If a new web server could not be started
    fileprivate static func getForDomain(_ domain:URL) throws -> WebServer {
        
        let key = URLHostAndPort(scheme: domain.scheme!, host: domain.host!, port: (domain as NSURL).port)
        
        if let existingServer = domainServerMap[key] {
            return existingServer
        }
        
        let newServer = try WebServer()
        domainServerMap[key] = newServer
        
        log.info("Web server started on port " + String(newServer.port) + " for domain " + domain.host!)
        
        return newServer
    }
    
    /// Convert a normal URL, for example: http://www.theguardian.co.uk/test.html to:
    /// http://localhost:23423/test.html
    static fileprivate func mapRequestURLToServerURL(_ requestURL:URL) throws -> URL {
        
        var components = URLComponents(url: requestURL, resolvingAgainstBaseURL: true)!
        
        let server = try getForDomain(requestURL)
        
        components.host = "localhost"
        components.port = server.port
        
        // using localhost so we can't serve over HTTPS
        components.scheme = "http"
        
        return components.url!
        
    }
    
    
    /// Map a local domain back to the original request URL.
    ///
    /// - Parameter serverURL: The http://localhost URL you want to convert
    /// - Returns: A URL with the original domain set, and existing path, search etc carried over.
    static func mapServerURLToRequestURL(_ serverURL:URL) -> URL {
        
        // And do the reverse.
        
        let components = URLComponents(url:serverURL, resolvingAgainstBaseURL: true)!
        
        let serverBeingUsed = self.domainServerMap
            .filter { (key, server) in
                return server.chosenPortNumber! == (serverURL as NSURL).port!
            }
            .first!.0
        
        components.host = serverBeingUsed.host
        components.port = serverBeingUsed.port
        components.scheme = serverBeingUsed.scheme
        
        return components.url!
        
    }
    
    
    /// Simple check to see if the URL provided is a localhost service worker URL or not.
    static func isLocalServerURL(_ maybeServerURL:URL) -> Bool {
        return maybeServerURL.host == "localhost"
    }
}
