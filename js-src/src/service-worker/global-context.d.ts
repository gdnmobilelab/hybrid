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

declare class __MessagePort {
    postMessage(message:String, ports: MessagePort[]):void
    postMessage(message:String):void
    onmessage(ev:MessageEvent):any
    close():void
    start():void
}

declare var Request: Function;
declare var Response: Function;
declare var GlobalFetch: any;
declare var Cache: any;
declare var __timeoutManager:any;
declare var Headers: any;

declare class caches {
    static openCallbackSuccessFailure(name: String, success: Function, failure: Function):void;
    static open: (name:string) => Promise<Cache>;
    static keysCallbackFailure(success: Function, failure: Function):void;
    static keys: (name:string) => Promise<String[]>;
}

declare class __WebSQLDatabaseCreator {
    static createDB(name:String): [any]
}

declare var __serviceWorkerRegistration:any;

declare var PushManager:any;

declare class NativeConsole {
    static logMessageArguments(level:string, args: any[]):void
}

declare class clients {
    static claimCallback(callback:Function):void;
    static matchAllCallback(options:any, callback:Function):void;
    static openWindowCallback(url:string, callback:Function):void
}

declare class Client {
    postMessagePortsCallback(message:any, ports: MessagePort[], callback:Function):void;
}

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