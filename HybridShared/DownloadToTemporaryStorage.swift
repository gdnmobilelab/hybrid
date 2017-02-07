//
//  DownloadToDisk.swift
//  hybrid
//
//  Created by alastair.coote on 03/11/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit
import UserNotifications


/// Used when preparing notification attachments. We download the remote assets into temporary storage, before
/// attaching them to the notification.
public class DownloadToTemporaryStorage {
    
    public static func start(_ fromURL:URL) -> Promise<URL> {
        
        return Promise<URL> { fulfill, reject in
            
            let task = URLSession.shared.downloadTask(with: fromURL) { (completeURL: URL?, response:URLResponse?, error:Error?) in
                
                
                if error != nil {
                    DispatchQueue.main.async {
                        reject(error!)
                    }
                } else {
                    
                    if let filename = response!.suggestedFilename {
                        
                        // Notification attachments appear to be controlled by file extension. The download task
                        // sets everything to a file with a .tmp extension - if we can, let's append the original
                        // extension on there.
                        //
                        // If we don't do this, the attachment fails. A .mp4 video with a .tmp extension is not recognised.
                        
                        let filenameAsURL = NSURL(fileURLWithPath: filename)
                        let fileExtension = filenameAsURL.pathExtension
                        
                        
                        if let ext = fileExtension {
                            
                            let urlWithExtension = completeURL!.appendingPathExtension(ext)
                            
                            do {
                                try FileManager.default.moveItem(at: completeURL!, to: urlWithExtension)
                                DispatchQueue.main.async {
                                    fulfill(urlWithExtension)
                                }
                                
                                return
                            } catch {
                                reject(error)
                            }
                        }
                        
                    } else {
                        DispatchQueue.main.async {
                            fulfill(completeURL!)
                        }
                    }
                }
            }
            task.priority = URLSessionTask.highPriority
            task.resume()
        }
        
        
    }
    
}
