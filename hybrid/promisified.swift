//
//  promisified.swift
//  hybrid
//
//  Created by alastair.coote on 06/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import Alamofire
import PromiseKit

struct AlamofireResponse {
    let request: NSURLRequest
    let response: NSHTTPURLResponse
    let data: NSData?
}

class Promisified {
    static func AlamofireRequest(method:String!, url:NSURL) -> Promise<AlamofireResponse> {
        
        return Promise { fulfill, reject in
                Alamofire
                    .request(Alamofire.Method(rawValue: method)!, url)
                    .response(completionHandler: { (req: NSURLRequest?, res: NSHTTPURLResponse?, data: NSData?, err: NSError?) in
                        if err != nil {
                            reject(err!)
                            return
                        }
                        
                        fulfill(AlamofireResponse(request: req!, response: res!, data: data))
            })
        }
    }
}
