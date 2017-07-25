//
//  ReadableStream.swift
//  ServiceWorker
//
//  Created by alastair.coote on 07/07/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation
import Shared

@objc public class ReadableStream : NSObject {
    
    var controller: ReadableStreamController?
    fileprivate var enqeueuedData = NSMutableData()
    fileprivate var pendingReads: [PendingRead] = []
    var closed = false
    public typealias PendingRead = (StreamReadResult) -> Void
    typealias StreamOperation = (ReadableStreamController) -> Void
    
    let start:StreamOperation?
    let pull:StreamOperation?
    let cancel:StreamOperation?
    
    init(start:StreamOperation? = nil, pull: StreamOperation? = nil, cancel:StreamOperation? = nil) {
        self.start = start
        self.pull = pull
        self.cancel = cancel
        super.init()
        self.controller = ReadableStreamController(self)
        
        if self.start != nil {
            self.start!(self.controller!)
        }
        
    }
    
    internal func enqueue(_ data:Data) throws {
        
        if self.closed == true {
            throw ErrorMessage("Cannot enqueue data after stream is closed")
        }
        
        
        
        if self.pendingReads.count > 0 {
            let read = self.pendingReads.remove(at: 0)
            read(StreamReadResult(done: false, value: data))
        } else {
            self.enqeueuedData.append(data)
        }
        
    }
    
    public func read(cb: @escaping PendingRead) {
        
        if self.enqeueuedData.length > 0 {
            cb(StreamReadResult(done: false, value: self.enqeueuedData as Data))
            self.enqeueuedData = NSMutableData()
        } else if self.closed == true {
            // If we're already closed then just push a done
            // block for good measure
            cb(StreamReadResult(done: true, value: nil))
        } else {
            self.pendingReads.append(cb)
        }
        
    }
    
    func close() {
        self.closed = true
        self.pendingReads.forEach { $0(StreamReadResult(done: true, value: nil))}
    }
    
    
}
