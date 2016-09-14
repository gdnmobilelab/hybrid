
let logLevels = ['info', 'log', 'error', 'warn'];

let originalConsole = global.console;

global.console = {};

logLevels.forEach((level) => {

    global.console[level] = function (message:string) {
        let argsAsArray = Array.prototype.slice.call(arguments);

        if (originalConsole && originalConsole !== global.console) {
            originalConsole[level].apply(originalConsole, argsAsArray);
        }

        NativeConsole.logMessageArguments(level, argsAsArray);
    }
})



