//
//  DownloadToDisk.swift
//  hybrid
//
//  Created by alastair.coote on 03/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit

class DownloadToTemporaryStorage {
    
    static func start(fromURL:NSURL) -> Promise<NSURL> {
        
        return Promise<NSURL> { fulfill, reject in
            
            let task = NSURLSession.sharedSession().downloadTaskWithURL(fromURL) { (completeURL: NSURL?, response:NSURLResponse?, error:NSError?) in
                
                
                if error != nil {
                    dispatch_async(dispatch_get_main_queue()) {
                        reject(error!)
                    }
                } else {
                    
                    if let filename = response!.suggestedFilename {
                        
                        // Notification attachments appear to be controlled by file extension. The download task
                        // sets everything to a file with a .tmp extension - if we can, let's append the original
                        // extension on there.
                        
                        let filenameAsURL = NSURL(fileURLWithPath: filename)
                        let fileExtension = filenameAsURL.pathExtension
                        
                        
                        if let ext = fileExtension {
                            
                            let urlWithExtension = completeURL!.URLByAppendingPathExtension(ext)!
                            
                            do {
                                try NSFileManager.defaultManager().moveItemAtURL(completeURL!, toURL: urlWithExtension)
                                dispatch_async(dispatch_get_main_queue()) {
                                    fulfill(urlWithExtension)
                                }
                                
                                return
                            } catch {
                                reject(error)
                            }
                        }
                        
                    }
                    dispatch_async(dispatch_get_main_queue()) {
                        fulfill(completeURL!)
                    }
                }
            }
            task.priority = NSURLSessionTaskPriorityHigh
            task.resume()
        }
        
        
    }
}
