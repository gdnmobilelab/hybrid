declare function __promiseCallback(callbackIndex: number, error?: any, response?: any): void;
declare function __execDatabaseQuery(nativeDbId:number, queries:string, readOnly:Boolean): string;
declare function __setGlobals(keys: [string]): void;
declare function __console(message:string): void;
declare function __createWebSQLConnection(name:string): number;
declare function __cacheOperation(callbackIndex:number, operation:String, cacheName:String, args:[any]): number;

declare interface ConsoleMessage {
    level:string;
    text:string;
}

declare class ExtendableEvent extends Event {
    waitUntil(promise: Promise<any>): void
    resolve():Promise<any>
}

declare interface FetchEventOptions {
    request: any
}

declare class FetchEvent extends Event {
    constructor(eventOptions: FetchEventOptions)
    new(eventOptions: FetchEventOptions): FetchEvent;
    responseWith(promise: Promise<any>): void
    resolve():Promise<any>
}

declare class WebviewClientManager {
    claim(callback: (err:string) => void): Promise<void>
    matchAll(options:ServiceWorkerClientsMatchOptions): Promise<ServiceWorkerClient[]>
    openWindow(url:String): Promise<WindowClient>
}

declare var __WebviewClientManager: WebviewClientManager;

declare var hybrid: any;

declare var global: any;

// declare var self: ServiceWorkerGlobalScope;

declare module "websql/custom" {
    var _temp:any;
    module _temp {}
    export = _temp
}

declare module "indexeddbshim" {
    var _temp:any;
    module _temp {}
    export = _temp;
}

declare module "idb-polyfill" {
    var _temp:any;
    module _temp {}
    export = _temp;
}

declare module "whatwg-fetch" {
    var _temp:any;
    module _temp {}
    export = _temp;
}