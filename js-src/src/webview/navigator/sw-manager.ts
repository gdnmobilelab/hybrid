import {PromiseOverWKMessage} from '../util/promise-over-wkmessage';
import EventEmitter from 'eventemitter3';
import * as path from 'path-browserify';
import {postMessage} from '../messages/message-channel';

export const serviceWorkerBridge = new PromiseOverWKMessage("serviceWorker");

class EventEmitterToJSEvent extends EventEmitter {
    addEventListener(type:string, listener:(ev:ErrorEvent) => void, useCapture:boolean) {
        this.addListener(type, listener);
    }

    dispatchEvent(evt:Event): boolean {
        this.emit(evt.type, evt);
        return true
    }

    removeEventListener(type:string, listener:(ev:ErrorEvent) => void) {
        this.removeListener(type, listener);
    }
}

class HybridServiceWorker extends EventEmitterToJSEvent implements ServiceWorker {
    scope:string;
    scriptURL:string;
    private _id:number;

    installState:ServiceWorkerInstallState
    get state():string {
        if (this.installState === ServiceWorkerInstallState.Activated) {
            return "activated"
        }
        if (this.installState === ServiceWorkerInstallState.Activating) {
            return "activating"
        }
        if (this.installState === ServiceWorkerInstallState.Installed) {
            return "installed"
        }
        if (this.installState === ServiceWorkerInstallState.Installing) {
            return "installing"
        }
        if (this.installState === ServiceWorkerInstallState.Redundant) {
            return "redundant"
        }
        throw new Error("Unrecognised install state:" + this.installState)
    }

    onstatechange:(statechangevent:any) => void;
    onmessage:(ev:MessageEvent) => any;
    onerror: (ev:ErrorEvent) => any;

    constructor(id:number, scriptURL:string, scope:string, state:ServiceWorkerInstallState) {
        super()
        this._id = id;
        this.scriptURL = scriptURL;
        this.scope = scope;
        this.installState = state;
    }

    updateState(state: ServiceWorkerInstallState) {
        if (state === this.installState) {
            return;
        }
        this.installState = state;
        if (this.onstatechange) {
            this.onstatechange({
                target: this
            });
        }
    }

    
    postMessage(message:any, options: any[]) {
        if (RegistrationInstance.active !== this) {
            throw new Error("Can only postMessage to active service worker");
        }

        if (options.length > 1 || options[0] instanceof MessagePort === false) {
            throw new Error("Currently only supports sending one MessagePort");
        }

        postMessage(message, [options[0] as MessagePort]);

    } 

    terminate() {
        throw new Error("Should not implement this.");
    }

    // addEventListener(type: "error", listener: (ev: ErrorEvent) => any, useCapture?: boolean): void {

    // }

    
}

class HybridRegistration extends EventEmitterToJSEvent implements ServiceWorkerRegistration {
    
    active: HybridServiceWorker
    installing: HybridServiceWorker
    waiting: HybridServiceWorker
    pushManager: any
    onupdatefound: () => void

    constructor() {
        super();

        this.addListener("updatefound", () => {
            if (this.onupdatefound) {
                this.onupdatefound();
            }
        })
    }

    getMostRecentWorker():HybridServiceWorker {
        // when we want the most current, regardless of actual status
        return this.active || this.waiting || this.installing;
    }

    update() {
        serviceWorkerBridge.bridgePromise({
            operation: "update",
            url: this.getMostRecentWorker().scriptURL
        })
    }

    get scope():string {
        return this.active.scope;
    }

    unregister(): Promise<boolean> {
        throw new Error("not yet")
    }

    clearAllInstancesOfServiceWorker(sw:HybridServiceWorker):void {
        // If a service worker has changed state, we want to ensure
        // that it doesn't appear in any old states
    
        if (this.active === sw) {
            this.active = null;
        }

        if (this.installing === sw) {
            this.installing = null;
        }

        if (this.waiting === sw) {
            this.waiting = null;
        }
    }

    

    assignAccordingToInstallState(sw:HybridServiceWorker) {

        this.clearAllInstancesOfServiceWorker(sw);
        
        if (sw.installState === ServiceWorkerInstallState.Activated && !this.active) {
            this.active = sw;
        }

        if (sw.installState === ServiceWorkerInstallState.Installed) {
            this.waiting = sw;
        }
        if (sw.installState === ServiceWorkerInstallState.Installing) {
            this.installing = sw;
            this.emit("updatefound", sw);
        }
    }
}

const RegistrationInstance = new HybridRegistration();

class HybridServiceWorkerContainer extends EventEmitter implements ServiceWorkerContainer  {
    controller: HybridServiceWorker
    
    oncontrollerchange: () => void
    onerror: () => void
    onmessage: () => void

    get ready(): Promise<ServiceWorkerRegistration> {
        if (this.controller) {
            console.debug("ServiceWorker ready returning immediately with activated instance");
            return Promise.resolve(RegistrationInstance);
        }

        return new Promise((fulfill, reject) => {
            console.debug("ServiceWorker ready returning promise and waiting...");
            this.once("controllerchange", () => {
                console.debug("ServiceWorker ready received response")
                fulfill()
            });
        })
    }

   

    constructor() {
        super();
        
        this.addListener("controllerchange", () => {
            if (this.oncontrollerchange) {

                // does it expect arguments? Unclear.
                this.oncontrollerchange();
            }
        });

    }

    register(url:string, options: ServiceWorkerRegisterOptions): Promise<ServiceWorkerRegistration> {

        let pathToSW = window.location.origin + path.resolve(window.location.pathname, url); 
        
        console.info("Attempting to register service worker at", pathToSW);
    
        return serviceWorkerBridge.bridgePromise({
            operation: "register",
            swPath: url,
            scope: options ? options.scope : null
        })
        .then((response:ServiceWorkerMatch) => {
            let worker = processNewWorkerMatch(response);
        
            return RegistrationInstance;
        })
    }

    claimedByNewWorker(sw:HybridServiceWorker) {
        RegistrationInstance.clearAllInstancesOfServiceWorker(sw);
        RegistrationInstance.active = sw;
        this.controller = sw;
        this.emit("controllerchange", sw);
    }

    getRegistration(scope:string): Promise<ServiceWorkerRegistration> {
        return Promise.resolve(RegistrationInstance);
    }

    getRegistrations(): Promise<ServiceWorkerRegistration[]> {
        // Not sure why we end up with more than one registration, ever.
        return Promise.resolve([RegistrationInstance]);
    }
}

export const ServiceWorkerContainer = new HybridServiceWorkerContainer(); 

enum ServiceWorkerInstallState {
    Installing = 0,
    Installed,
    Activating,
    Activated,
    Redundant
}

interface ServiceWorkerMatch {
    url: string,
    installState: ServiceWorkerInstallState,
    instanceId:number,
    scope: string
}

const serviceWorkerRecords: {[id:number] : HybridServiceWorker} = {};

function processNewWorkerMatch(newMatch:ServiceWorkerMatch) {
    // if we already have a record, use that one
    let worker = serviceWorkerRecords[newMatch.instanceId];

    if (!worker) {
        // otherwise, make a new one
        worker = new HybridServiceWorker(newMatch.instanceId, newMatch.url, newMatch.scope, newMatch.installState);
        serviceWorkerRecords[newMatch.instanceId] = worker;
    } else {
        worker.updateState(newMatch.installState);
    }

    RegistrationInstance.assignAccordingToInstallState(worker);

    console.log("SW CHANGE", newMatch);
    return worker;
}

serviceWorkerBridge.addListener('sw-change', processNewWorkerMatch);

serviceWorkerBridge.addListener('claimed', function(match:ServiceWorkerMatch) {
    let worker = processNewWorkerMatch(match);
    console.log("Claimed by new worker")
    ServiceWorkerContainer.claimedByNewWorker(worker);
})
// On page load we grab all the currently applicable service workers

serviceWorkerBridge.bridgePromise({
    operation: "getAll"
}).then((workers: ServiceWorkerMatch[]) => {
    workers.forEach((worker) => {
        serviceWorkerRecords[worker.instanceId] = new HybridServiceWorker(worker.instanceId, worker.url, "", worker.installState);
        RegistrationInstance.assignAccordingToInstallState(serviceWorkerRecords[worker.instanceId]);
    })
})