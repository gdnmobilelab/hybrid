

export class ExtendableEvent {

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

export class FetchEvent {

    private request:Object;
    public type:string;
    private respondWithPromise:Promise<any> = null;

    constructor(data?: FetchEventOptions) {
        this.type = "fetch";
        this.request = data.request;
    }

    respondWith(promise:Promise<any>) {
        this.respondWithPromise = promise;
    }

    resolve() {
        if (this.respondWithPromise !== null) {
            // Isn't necessarily a Promise - can return a Response directly.
            return Promise.resolve(this.respondWithPromise);
        }
        return Promise.resolve();
    }
}

global.ExtendableEvent = ExtendableEvent;
global.FetchEvent = FetchEvent;