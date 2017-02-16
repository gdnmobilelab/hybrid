
export type ReceiveFromNativeEventType = 
    "promiseReturn" |
    "fsdfsdf";


let storedReturnPromises: Promise<any>[] = [];

export class ReceiveFromNativeEvent {

    type: String
    data: any

    storedPromiseId = -1

    constructor(type: String, data: any) {
        this.type = type;
        this.data = data;
    }

    respondWith(promise:Promise<any>) {

        if (this.storedPromiseId !== -1) {
            throw new Error("respondWith has already been called");
        }

        let vacantStoreId = 0;
        
        while (storedReturnPromises[vacantStoreId]) {
            vacantStoreId++;
        }

        storedReturnPromises[vacantStoreId] = promise;

        this.storedPromiseId = vacantStoreId;
    }

    get metadata() {

        if (this.storedPromiseId === -1) {

            return {
                type: 'null'
            }

        } else {

            return {
                type: 'promise',
                promiseId: this.storedPromiseId
            }

        }

    }

    // resolve() {
    //     if (this.respondWithPromise !== null) {
    //         return this.respondWithPromise;
    //     } else {
    //         return Promise.resolve();
    //     }
    // }

}