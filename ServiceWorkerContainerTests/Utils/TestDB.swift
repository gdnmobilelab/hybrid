//
//  TestDB.swift
//  ServiceWorkerContainerTests
//
//  Created by alastair.coote on 21/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

class TestDB {
    static let path = URL(fileURLWithPath: NSTemporaryDirectory() + "temp.db")
    
    static func delete() {
        do {
            if FileManager.default.fileExists(atPath: self.path.path) {
                try FileManager.default.removeItem(atPath: self.path.path)
            }
        } catch {
            fatalError(String(describing: error))
        }
    }
}
