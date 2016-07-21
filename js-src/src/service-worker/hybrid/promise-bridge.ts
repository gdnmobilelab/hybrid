hybrid.promiseBridgeBackToNative = function(callbackIndex:number, promise: Promise<any>) {
    promise
    .then((response) => {
        __promiseCallback(callbackIndex, null, response)
    })
    .catch((err) => {
        __promiseCallback(callbackIndex, {
            message: err.message,
            stack: err.stack
        })
    })
}