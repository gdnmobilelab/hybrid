import ES6 from 'es6-promise';
import events from 'events';

let Promise = ES6.Promise;
export function emitWithWaitUntil(name:string, event:ExtendableEvent) {
    
    return new Promise((fulfill, reject) => {
        let usedWaitUntil = false;
        event.waitUntil = (promise:Promise<any>) => {
            usedWaitUntil = true;
            promise.then(() => fulfill())
        }
        
        try {

            // waitUntil is optional, so we still need to handle cases
            // where the handler does an immediate return.

            (this as EventEmitter).emit(name, event);

            if (usedWaitUntil === false) {
                fulfill();
            }

        } catch (err) {
            reject(err)
        }
        

        
    })
}