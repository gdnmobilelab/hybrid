global.test = require('blue-tape');

let str = global.test.createStream({objectMode: true});

let testOutputs = [];
let testsComplete = false;

str.on('data', (chunk) => {
    console.log(JSON.stringify(chunk, null,2))
    testOutputs.push(chunk)
});

str.on('close', () => {
    testsComplete = true;
})

if (typeof self != 'undefined' && self.addEventListener) {
    // Service Worker environment

    self.addEventListener('message', (e) => {

        if (testsComplete) {
            e.ports[0].postMessage(testOutputs)
            return;
        }

        str.on('close', () => {
            e.ports[0].postMessage(testOutputs)
        })
    })
}