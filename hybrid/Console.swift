//
//  Console.swift
//  hybrid
//
//  Created by alastair.coote on 02/09/2016.
//  Copyright © 2016 Alastair Coote. All rights reserved.
//

import Foundation
import JavaScriptCore


/// A layer that we place between the browser debug console and the service worker, so that
/// we can see debug output in the XCode console
@objc class Console : NSObject {
    
    
    /// We keep a reference to the original console so that debug messages still
    /// come through to a browser debugger we might have attached.
    let originalConsole:JSValue
    
    init(context:JSContext) {
        
        self.originalConsole = context.objectForKeyedSubscript("console")
       
        super.init()
        
        let newConsole = JSValue(newObjectInContext: context)
        context.setObject(newConsole, forKeyedSubscript: "console")
        
        // make our log function accessible from JS
        let logAsConvention: @convention(block) (String, NSArray) -> Void = self.logFromJS
        let logAsAnObject = unsafeBitCast(logAsConvention, AnyObject.self)
        
        // This is a bit weird. But if we want to log all the arguments passed to a function
        // without knowing how many there are, we rely on the JS "arguments" object every
        // function has. Make a function that wraps our native log function with the log level,
        // then pass the arguments array back to our native logger.
        let logFuncCreator = context.objectForKeyedSubscript("Function")
            .constructWithArguments(["level", "func", "return function() {func(level,arguments);}"])
        
        let levels = ["info", "log", "error", "warn"]
        
        for level in levels {
            let logJS = logFuncCreator.callWithArguments([level, logAsAnObject])
            newConsole.setObject(logJS, forKeyedSubscript: level)
        }
        
        
    }
    
    func logFromJS(level:String, arguments:NSArray) {
        
        if self.originalConsole.isUndefined == false {
            self.originalConsole
                .objectForKeyedSubscript(level)
                .callWithArguments(arguments as [AnyObject])
        }
        
        var argsTextArray = [String]()
        
        for arg in arguments {
            
            argsTextArray.append(String(arg))
        }
        
        
        let argsText = argsTextArray.joinWithSeparator(" ")
        
        if level == "info" || level == "log" {
            log.info(argsText)
        }
        else if level == "warn" {
            log.warning(argsText)
        }
        else if level == "error" {
            log.error(argsText)
        }
    }
    

}
