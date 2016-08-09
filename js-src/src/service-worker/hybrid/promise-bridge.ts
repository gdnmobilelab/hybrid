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

interface PromiseResults {
    fulfill: Function,
    reject: Function
}

const storedPromiseCallbacks: {[key: number]: PromiseResults} = {}

hybrid.promiseCallback = function(callbackIndex:number, fulfillValue:any, rejectValue:any) {
  
    let storedPromise = storedPromiseCallbacks[callbackIndex];

    if (storedPromise === null) {
        throw new Error("Tried to use promise callback that does not exist");
    }
  
    if (rejectValue !== null) {
        storedPromise.reject(rejectValue);
    } else {
        storedPromise.fulfill(fulfillValue);
    }
}

export function storePromiseResult(fulfill: Function, reject: Function): number {
    let index = 0;
    while (storedPromiseCallbacks[index]) {
        index++;
    }
    storedPromiseCallbacks[index] = {fulfill, reject};
    return index;
}