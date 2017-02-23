import { NativeItemProxy } from '../bridge/native-item-proxy';
import { registerClass } from '../bridge/connected-items';
import { ServiceWorker } from './service-worker';
import { ReceiveFromNativeEvent } from '../bridge/receive-from-native-event';

export class ServiceWorkerRegistration extends NativeItemProxy {

    installing: ServiceWorker;
    waiting: ServiceWorker;
    activating: ServiceWorker;
    active: ServiceWorker;
    redundant: ServiceWorker;

    scope:string

    constructor(scope:string) {
        super();
        this.scope = scope;
        this.nativeEvents.on('statechange', this.setWorkerState.bind(this))
    }

    setWorkerState(ev:ReceiveFromNativeEvent) {

        let {property, worker} = ev.data;

        if (property === 'installing') {
            this.installing = worker;
        } else if (property === 'waiting') {
            this.waiting = worker;
        } else if (property === 'activating') {
            this.activating = worker;
        } else if (property === 'active') {
            this.active = worker;
        } else if (property === 'redundant') {
            this.redundant = worker;
        } else {
            throw new Error("Did not understand property " + property)
        }

        console.info("Received worker for state: " + property);


        console.log('workerstate', arguments)
    }

    getArgumentsForNativeConstructor(): any[] {
        return [];
    }

    unregister(): Promise<any> {
        return this.emitJSEvent("unregister", null);
    }

};

registerClass("ServiceWorkerRegistration", ServiceWorkerRegistration);