//
//  FetchRequest.swift
//  ServiceWorkerTests
//
//  Created by alastair.coote on 21/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

public enum FetchRequestRedirect: String {
    case Follow = "follow"
    case Error = "error"
    case Manual = "manual"
}

public enum FetchRequestCache: String {
    case Default = "default"
    case Reload = "reload"
    case NoCache = "no-cache"
}

public class FetchRequest {
    var method:String = "GET"
    let url: URL
    var headers: FetchHeaders? = nil
    var referrer: URL? = nil
    var referrerPolicy: String? = nil
    var mode:String = "no-cors"
    var redirect: FetchRequestRedirect = FetchRequestRedirect.Follow
    var cache: FetchRequestCache = FetchRequestCache.Default
    var body: Data?
    
    init(url: URL) {
        self.url = url
    }
}



