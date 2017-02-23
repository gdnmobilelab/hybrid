import { NativeItemProxyWithEvents } from '../bridge/native-item-proxy';
import { ReceiveFromNativeEvent } from '../bridge/receive-from-native-event';
import { ServiceWorkerRegistration } from './service-worker-registration';
import { registerClass } from '../bridge/connected-items';
import { ServiceWorker } from './service-worker';

interface ServiceWorkerRegistrationOptions {
    scope?: string
};

export class ServiceWorkerContainer extends NativeItemProxyWithEvents {

    ready: Promise<any>;
    controller: ServiceWorker;

    oncontrollerchange:Function;

    constructor() {
        super();

        // This doesn't actually do anything except serialize the container and
        // send it over to the native side. If we don't do that, the native version
        // never gets created, so never looks for workers etc.
        this.emitJSEvent("init");


        this.nativeEvents.on('newactiveregistration', this.receiveActiveRegistration.bind(this));

        // Create our ready promise, and set a listener that'll fulfill the promise
        // when we receive a new active registration.
        this.ready = new Promise((fulfill, reject) => {

            this.nativeEvents.once('newactiveregistration', (ev:ReceiveFromNativeEvent) => {
                console.log('FIRED READY EVENT')
                let reg = ev.data as ServiceWorkerRegistration;
                try {
                    fulfill(reg);
                } catch (err) {
                    reject(err);
                }
            })

        });

        this.addEventListener('controllerchange', function(ev:Event) {
            if (this.oncontrollerchange instanceof Function) {
                this.oncontrollerchange(ev);
            }
        })
    }

    receiveActiveRegistration(ev:ReceiveFromNativeEvent) {
        console.log('wtffffff')
        let newRegistration = ev.data as ServiceWorkerRegistration;
        this.controller = newRegistration.active;

        this.dispatchEvent({
            type: "controllerchange",
            target: this
        });

        console.log("SET CONTROLLER?", newRegistration.active);
    }

    getArgumentsForNativeConstructor(): any[] {

        let frameType = window.top === window ? 'top-level' : 'nested';

        return [window.location.href, frameType];
    }

    register(url: URL, options: ServiceWorkerRegistrationOptions = {}) : Promise<void> {
        return this.emitJSEvent("register", [url, options]);
    }

    getRegistrations() : Promise<[ServiceWorkerRegistration]> {
        return this.emitJSEvent("getRegistrations")
        .then((r) => {
            console.log('result?', r)
            return r;
        })
    }

}

registerClass("ServiceWorkerContainer", ServiceWorkerContainer);