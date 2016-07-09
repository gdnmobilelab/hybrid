export function send(msg) {
    if (typeof msg.arguments === "object") {
        msg.arguments = JSON.stringify(msg.arguments);
    }
    window.webkit.messageHandlers.hybrid.postMessage(msg);
}

// WebKit messageHandlers don't actually allow a response, so instead
// we store an array of callback functions, which we then call in-app
// with a window._hybridCallback call. 

const callbackArray = [];

export function sendAndReceive(msg) {
    
    let callbackIndex = 0;

    while (callbackArray[callbackIndex]) {
        callbackIndex++;
    }

    return new Promise((fulfill, reject) => {
        callbackArray[callbackIndex] = (err, resp) => {
            callbackArray[callbackIndex] = null;
            if (err) {
                return reject(err);
            } else {
                return fulfill(resp);
            }
        };
        msg._callbackIndex = callbackIndex;
        send(msg);
    });
};

window._hybridCallback = function(callbackIndex, err, resp) {
    console.log('idx',callbackIndex)
    callbackArray[callbackIndex](err, resp);
}