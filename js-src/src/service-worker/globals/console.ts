

const makeSuitable = (val:any) => {
    if (val instanceof Error) {
        return val.toString()
    } else {
        return JSON.stringify(val)
    }
}

let logLevels = ['info', 'log', 'error'];

global.console = {};

logLevels.forEach((level) => {
    global.console[level] = function (message:string) {
        let argsAsJSON = Array.prototype.slice.call(arguments).map(makeSuitable);
        __console(JSON.stringify({
            level: level,
            text: argsAsJSON.join(',')
        }))
    }
})
