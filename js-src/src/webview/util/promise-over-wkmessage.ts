import EventEmitter from 'eventemitter3';
const webkit = (window as any).webkit;

// We need these callbacks to be globally accessible.
const promiseCallbacks: {[key:string]: Function} = {};
const promiseBridges: {[key:string]: PromiseOverWKMessage} = {};
(window as any).__promiseBridgeCallbacks = promiseCallbacks;
(window as any).__promiseBridges = promiseBridges;

export class PromiseOverWKMessage extends EventEmitter {

    private callbackArray:[Function, Function][] = []
    private name:string;

    constructor(name:string) {
        super()
        this.name = name;
        if (!webkit.messageHandlers[name]) {
            throw new Error(`Message handler "${name}" does not exist`);
        }

        if (webkit.messageHandlers[name]._receive) {
            throw new Error(`Promise bridge for "${name}" already exists"`)
        }
        
        promiseCallbacks[name] = this.receiveResponse.bind(this);
        promiseBridges[name] = this;
    }

    bridgePromise(message:any) {

        // Find the next available slot in our callback array

        let callbackIndex = 0;
        while (this.callbackArray[callbackIndex]) {
            callbackIndex++;
        }
       
        return new Promise((fulfill, reject) => {

            // Now insert our callback into the cached array.
            
            this.callbackArray[callbackIndex] = [fulfill, reject];
            console.debug("Sending", {callbackIndex, message})
            webkit.messageHandlers[this.name].postMessage({callbackIndex, message});

        })

    }

    emitWithResponse(name:string, args:string[], callbackIndex:number) {

        // Allows us to emit events with callbacks

        let respondValue:Promise<any> = null

        let respondWith = function(p:any) {
            respondValue = p;
        }

        let eventData = {
            respondWith,
            arguments: args
        };
        
        this.emit(name, eventData);

        Promise.resolve(respondValue)
        .then((finalResponse) => {
            console.log("FULFILL", callbackIndex)
            this.send({
                callbackResponseIndex: callbackIndex,
                fulfillValue: finalResponse
            })
        })
        .catch((err) => {
            console.log("CATCH", callbackIndex)
            this.send({
                callbackResponseIndex: callbackIndex,
                rejectValue: err.toString()
            })
        })
    }

    send(message:any) {
        
        // Shortcut when we only want to send and are not expecting a response
        webkit.messageHandlers[this.name].postMessage({message});
    }

    receiveResponse(callbackIndex:number, err:string, response: any) {
        
        try {
            let thisCallback = this.callbackArray[callbackIndex];
            
            if (!thisCallback) {
                throw new Error("Tried to use a callback that didn't exist");
            }

            // free up this slot for next operation
            this.callbackArray[callbackIndex] = null;

            let [fulfill, reject] = thisCallback;

            if (err) {
                reject(new Error(err));
            } else {
                fulfill(response);
            }
        } catch (err) {
            console.error(err);
        }
    }

}