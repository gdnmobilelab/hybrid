
let waitUntil = function() {

}

export function emitWithWaitUntil(name, event) {
    return new Promise((fulfill, reject) => {
        let usedWaitUntil = false;

        event.waitUntil = (promise) => {
            usedWaitUntil = true;
            promise.then(() => fulfill())
        }

        try {

            // waitUntil is optional, so we still need to handle cases
            // where the handler does an immediate return.

            this.emit(name, event);

            if (usedWaitUntil === false) {
                fulfill();
            }

        } catch (err) {
            reject(err)
        }
        

        
    })
}