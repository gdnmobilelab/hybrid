import {PushMessageData} from './push';

export class ExtendableEvent {

    public type:string;
    private waitUntilPromise:Promise<any> = null;
    public bubbles:boolean = false;

    constructor(type:string, data?: Object) {
        this.type = type;

        if (data) {
            Object.assign(this, data);
        }
        
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

    private request:any;
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

export class PushEvent extends ExtendableEvent {
    data: PushMessageData

    constructor(content:string) {
        super("push", {});
        this.data = new PushMessageData(content);
    }
}

global.ExtendableEvent = ExtendableEvent;
global.FetchEvent = FetchEvent;
global.PushEvent = PushEvent;