//
//  UrlOrNilFromString.swift
//  hybrid
//
//  Created by alastair.coote on 10/02/2017.
//  Copyright © 2017 Alastair Coote. All rights reserved.
//

import Foundation

public func URLOrNilFromString(_ str:String?, relativeTo:URL? = nil) -> URL? {
    if str == nil {
        return nil
    }
    return URL(string: str!, relativeTo: relativeTo)
}
