//
//  DelayedPromiseStore.swift
//  hybrid
//
//  Created by alastair.coote on 14/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation
import PromiseKit

struct StoredPromise {
    let id: Int
    let fulfill: (Any?) -> Void
    let reject: (Error) -> Void
}

class DelayedPromiseStore {
    
    fileprivate var store = [StoredPromise]()
    
    func add(forId:Int, fulfill: @escaping (Any?) -> Void, reject: @escaping (Error) -> Void) {
        store.append(StoredPromise(id: forId, fulfill: fulfill, reject: reject))
    }
    
    func resolve(forId: Int, error:Error?, data:Any?) {
        
        let promises = self.store.filter { $0.id == forId }
            
        promises.forEach { storedPromise in
            if let hasError = error {
                storedPromise.reject(hasError)
            } else {
                storedPromise.fulfill(data)
            }
            
        }
        
        // Clear these stored promises now that we're done with them
        self.store = self.store.filter { $0.id != forId }

    }
    
    func wait(forId: Int) -> Promise<Any?> {
        return Promise(resolvers: { (fulfill, reject) in
            self.add(forId: forId, fulfill: fulfill, reject: reject)
        })
    }
    
}
