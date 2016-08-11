import {send} from './wk-messaging';

let consoleAsAny:any = console;

const makeSuitable = (val:any) => {
    if (val instanceof Error) {
        return val.toString()
    } else {
        return JSON.stringify(val)
    }
}

if (!consoleAsAny._hybridHooked) {
    let levels = ['info', 'log', 'error'];

    levels.forEach((level) => {
        let original = consoleAsAny[level];
        consoleAsAny[level] = function() {
            
            // Still output to web console in case we have Safari debugger attached.
            if (original) {
                original.apply(console, arguments);
            }
            
            // Array.from because otherwise it transforms to an object like {"0": "", "1": ""}
            
            let argsAsJSON = Array.from(arguments).map(makeSuitable);
            
            send({
                command: 'console',
                arguments: {
                    level: level,
                    text: argsAsJSON.join(",")
                }
            });
        }
    });
    
    // send errors to XCode debug
    if (window) {
        window.onerror = function(message, file, line, col, error) {
            console.error(arguments);
        }
    }
    
        
    consoleAsAny._hybridHooked = true;
}

