declare function __promiseCallback(callbackIndex: number, error?: Error, response?: any): void;
declare function __setGlobals(keys: [string]): void;

declare class ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void
    resolve():Promise<any>
}

declare var hybrid: Object;

declare var global: any;