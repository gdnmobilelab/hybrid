
// const makeSuitable = (val:any) => {
//     try {
//         if (val instanceof Error) {
//             return val.toString()
//         } else {
//             return JSON.stringify(val)
//         }
//     } catch (err) {
//         return "COULD NOT MAKE SUITABLE: " + err
//     }
// }

// if (typeof global.console === "undefined") {
//     let logLevels = ['info', 'log', 'error'];

//     global.console = {};

//     logLevels.forEach((level) => {
//         global.console[level] = function (message:string) {
//             let argsAsJSON = Array.prototype.slice.call(arguments).map(makeSuitable);
//             __console(JSON.stringify({
//                 level: level,
//                 text: argsAsJSON.join(',')
//             }))
//         }
//     })
// }


