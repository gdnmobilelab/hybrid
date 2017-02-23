import { sendToNative } from './bridge';
import { sharedStorage } from '../shared-storage/shared-storage';
import { notNativeConsole } from '../global/console';

export type DispatchToNativeEventType = 
    "resolvepromise" |
    "sendtoitem" |
    "createbridgeitem" |
    "clearbridgeitems" |
    "connectproxyitem";

interface PromiseResolve {
    fulfill: Function;
    reject: Function;
}

if (!sharedStorage.storedResolves) {
    sharedStorage.storedResolves = {};
}

const storedResolves: { [id: number] : PromiseResolve } = sharedStorage.storedResolves;

export class DispatchToNativeEvent {

    type: string
    data: any
    storedResolveId = -1

    constructor(type: DispatchToNativeEventType, data: any = null) {
        this.type = type;
        this.data = data;
    }

    dispatch() {
        // notNativeConsole.info(`Dispatching command ${this.type} to native...`, this.data)
        sendToNative({
            command: this.type,
            data: this.data,
            storedResolveId: this.storedResolveId
        })
    }

    // Dispatch this event to the native environment, and wait
    // for a response
    dispatchAndResolve() {
        
        return new Promise((fulfill, reject) => {

            let vacantResolveId = 0;

            while (storedResolves[vacantResolveId]) {
                vacantResolveId++;
            }

            storedResolves[vacantResolveId] = {fulfill, reject};

            this.storedResolveId = vacantResolveId;

            this.dispatch();

        })

    }

    static resolvePromise(promiseId: number, data: any, error: string) {

        let {fulfill, reject} = storedResolves[promiseId];

        if (error) {
            reject(new Error(error));
        } else {
            fulfill(data);
        }

        storedResolves[promiseId] = null;

    }
}