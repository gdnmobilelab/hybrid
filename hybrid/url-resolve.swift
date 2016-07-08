//
//  url-resolve.swift
//  hybrid
//
//  Created by alastair.coote on 01/07/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation

class URLUtilities {
    static func resolveToBaseURL(targetURL: NSURL, baseURL: NSURL) -> NSURL {
        var urlToReturn = targetURL;
        if (targetURL.host == nil) {
            
            // the URL is relative to the current base URL, so let's start there.
            var baseDirectory = baseURL
            if (baseDirectory.pathExtension != nil && baseDirectory.pathExtension != "") {
                // is a file, let's go back to directory
                baseDirectory = baseDirectory.URLByDeletingLastPathComponent!
            }
            urlToReturn = baseDirectory.URLByAppendingPathComponent(targetURL.path!)
            
            // is there really no better way to normalise paths?
            let pathAsNormalisedString = NSString(string: urlToReturn.path!).stringByStandardizingPath;
            
            let finalURL = NSURLComponents()
            finalURL.scheme = urlToReturn.scheme
            finalURL.host = urlToReturn.host
            finalURL.path = pathAsNormalisedString
            finalURL.port = urlToReturn.port
            urlToReturn = finalURL.URL!

        }
        
        return urlToReturn
    }
}