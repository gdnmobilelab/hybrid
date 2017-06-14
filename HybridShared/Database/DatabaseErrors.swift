//
//  DatabaseErrors.swift
//  ServiceWorkerContainer
//
//  Created by alastair.coote on 13/06/2017.
//  Copyright © 2017 Guardian Mobile Innovation Lab. All rights reserved.
//

import Foundation

enum DatabaseErrors: String, Error {
    case MigrationInitFailed = "Attempt to create the migrations table failed"
}
