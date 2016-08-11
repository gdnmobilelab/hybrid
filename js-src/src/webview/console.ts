import {PromiseOverWKMessage} from './util/promise-over-wkmessage';

const promiseBridge = new PromiseOverWKMessage("console");

const makeSuitable = (val:any) => {
    if (val instanceof Error) {
        return val.toString();
    } else if (typeof val == "string") {
        return val;
    } else if (val === null || val === undefined) {
        return "null"
    } else {
        return JSON.stringify(val);
    }
}

let levels = ['debug','info', 'log', 'error', 'warn'];

let console:{[level:string]: Function} = {};

let originalConsole = window.console as any;

(window as any).console = console;

levels.forEach((level) => {
    console[level] = function() {
        
        if (originalConsole) {
            // still log out to webview console, in case we're attached
            originalConsole[level].apply(originalConsole, arguments);
        }

        let argsAsJSON = Array.from(arguments).map(makeSuitable);

        promiseBridge.send({
            level: level,
            args: argsAsJSON
        })
    }
})