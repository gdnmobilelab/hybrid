//
//  ServiceWorker.swift
//  ServiceWorker
//
//  Created by alastair.coote on 14/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

public class ServiceWorker {
    
    public let url:URL
    public let id:String
    
    public init(id:String, url: URL) {
        self.id = id
        self.url = url
    }
    
}
