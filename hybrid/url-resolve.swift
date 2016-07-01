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
            let urlAsNormalisedString = NSString(string: urlToReturn.absoluteString).stringByStandardizingPath;
            urlToReturn = NSURL(string: urlAsNormalisedString)!
        }
        
        return urlToReturn
    }
}