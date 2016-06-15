import {send} from './wk-messaging';

const makeSuitable = (val) => {
    if (val instanceof Error) {
        return val.toString()
    } else {
        return JSON.stringify(val)
    }
}

if (!console._hybridHooked) {
    let levels = ['info', 'log', 'error'];

    levels.forEach((level) => {
        let original = console[level];
        console[level] = function() {
            
            // Still output to web console in case we have Safari debugger attached.
            original.apply(console, arguments);
            
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
    window.onerror = function(message, file, line, col, error) {
        console.error(arguments);
    }
        
    console._hybridHooked = true;
}

