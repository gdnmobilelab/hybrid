import { sendToNative } from './bridge';
import { sharedStorage } from '../shared-storage/shared-storage';

export type DispatchToNativeEventType = 
    "resolvepromise" |
    "sendtoitem" |
    "createbridgeitem" |
    "clearbridgeitems";

interface PromiseResolve {
    fulfill: Function;
    reject: Function;
}

if (!sharedStorage.storedResolves) {
    console.info("create new shared store")
    sharedStorage.storedResolves = {};
}

const storedResolves: { [id: number] : PromiseResolve } = sharedStorage.storedResolves;

export class DispatchToNativeEvent {

    type: string
    data: any
    storedResolveId = -1
    targetItemId:number

    constructor(type: DispatchToNativeEventType, data: any, targetItemId:number = null) {
        this.type = type;
        this.data = data;
        this.targetItemId = targetItemId;
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

            console.log('stored resolves', storedResolves)

            this.storedResolveId = vacantResolveId;

            console.info("Sending event to native with targetId", this.targetItemId, "and promiseId", this.storedResolveId)

            sendToNative({
                command: this.type,
                data: this.data,
                storedResolveId: this.storedResolveId,
                targetItemId: this.targetItemId
            })

        })

    }

    static resolvePromise(promiseId: number, data: any, error: string) {

        console.info("Resolving promise #", promiseId, storedResolves);

        let {fulfill, reject} = storedResolves[promiseId];

        if (error) {
            reject(new Error(error));
        } else {
            fulfill(data);
        }

        // storedResolves[promiseId] = null;

    }
}