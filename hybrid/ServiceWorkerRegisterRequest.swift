//
//  ServiceWorkerRegisterRequest.swift
//  hybrid
//
//  Created by Alastair Coote on 5/7/16.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import JSONCodable
import Foundation

struct ServiceWorkerRegisterRequest {
    let url: String;
    let scope: String?;
}

extension ServiceWorkerRegisterRequest : JSONDecodable {
    init(object: JSONObject) throws {
        let decoder = JSONDecoder(object: object);
        url = try decoder.decode("url");
        scope = try decoder.decode("scope");
    }
}