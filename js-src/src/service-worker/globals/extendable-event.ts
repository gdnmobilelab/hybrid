

export default class ExtendableEvent {

    private data:Object;
    public type:string;
    private waitUntilPromise:Promise<any> = null;

    constructor(type:string, data?: Object) {
        this.type = type;
        this.data = data;
    }

    waitUntil(promise:Promise<any>) {
        this.waitUntilPromise = promise;
    }

    resolve() {
        if (this.waitUntilPromise !== null) {
            return this.waitUntilPromise
        }
        return Promise.resolve();
    }
}

global.ExtendableEvent = ExtendableEvent;