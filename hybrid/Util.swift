//
//  Util.swift
//  hybrid
//
//  Created by alastair.coote on 25/08/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import UIKit
import XCGLogger
import EmitterKit

let log = XCGLogger.defaultInstance()
let ApplicationEvents = Event<AnyObject>()


/// A dumping ground for some quick utility functions we've used across the app
class Util {
    
    /// Parse an HTTP Date header (EEE, dd MMM yyyy HH:mm:ss z) into an NSDate
    ///
    /// - Parameter httpDate: contents of the Date header as a string
    /// - Returns: a matching NSDate
    static func HTTPDateToNSDate(httpDate:String) -> NSDate? {
        let dateFormat = NSDateFormatter()
        dateFormat.dateFormat = "EEE, dd MMM yyyy HH:mm:ss z"
        dateFormat.locale = NSLocale(localeIdentifier: "en_US_POSIX")
        
        let date = dateFormat.dateFromString(httpDate)
        return date
        
    }
    
    
    /// Create a SHA256 representation of any data provided
    ///
    /// - Parameter data: the data to hash
    /// - Returns: the hash, in the form of NSData
    static func sha256(data:NSData) -> NSData {
        var hash = [UInt8](count: Int(CC_SHA256_DIGEST_LENGTH), repeatedValue: 0)
        CC_SHA256(data.bytes, CC_LONG(data.length), &hash)
        let res = NSData(bytes: hash, length: Int(CC_SHA256_DIGEST_LENGTH))
        return res
    }
    
    
    /// Wrapper to provide SHA256 hashing of a string. Used in the ServiceWorkerStub to compare
    /// JS content without having to hold both large text blobs in memory
    ///
    /// - Parameter str: string to hash
    /// - Returns: hash as NSData
    static func sha256String(str:String) -> NSData {
        let asData = str.dataUsingEncoding(NSUTF8StringEncoding)
        return sha256(asData!)
    }
    
    
    /// Because we have content extensions, mainBundle() can sometimes return an extension
    /// rather than the app itself. This function detects that, and resets it, so we know for
    /// sure that we are always receiving the app bundle.
    ///
    /// - Returns: An NSBundle for the main hybrid app
    static func appBundle() -> NSBundle {
        var bundle = NSBundle.mainBundle()
        if bundle.bundleURL.pathExtension == "appex" {
            // Peel off two directory levels - MY_APP.app/PlugIns/MY_APP_EXTENSION.appex
            bundle = NSBundle(URL: bundle.bundleURL.URLByDeletingLastPathComponent!.URLByDeletingLastPathComponent!)!
        }
        return bundle
    }
}
