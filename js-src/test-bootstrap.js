// Need to emulate our JSContext in Node

global.self = {};
global.hybrid = {};
global.window = global;
global.navigator = {
    userAgent: "Hybrid service worker"
}

global.__console = function(msg) {
    console.log(msg)
    console[msg.level].apply(console, msg.text)
}

require('./src/service-worker/include')

