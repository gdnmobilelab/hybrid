import {PushMessageData} from './push';

export class ExtendableEvent {

    public type:string;
    private waitUntilPromise:Promise<any> = null;
    public bubbles:boolean = false;

    constructor(type:string, data?: Object) {
        this.type = type;
        

        if (data && (data as any).__keys) {

            // When we're passing a complex object (e.g. class) in, we
            // can't rely on Object.assign. So we specify keys

            (data as any).__keys.forEach((key:string) => {
                let source = (data as any)[key];

                if (source.bind) {
                    console.log("WITH BIND: " + key);
                    (this as any)[key] = source.bind(data);
                } else {
                    (this as any)[key] = source;
                }
            })
        } else if (data) {
            
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