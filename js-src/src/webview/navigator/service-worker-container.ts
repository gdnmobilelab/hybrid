import { NativeItemProxy } from '../bridge/native-item-proxy';
import { ReceiveFromNativeEvent } from '../bridge/receive-from-native-event';
import { ServiceWorkerRegistration } from './service-worker-registration';
import { registerClass } from '../bridge/connected-items';

interface ServiceWorkerRegistrationOptions {
    scope?: string
};

class ServiceWorkerContainer extends NativeItemProxy {

    constructor() {
        super();

        // this.nativeEvents.on('test', (e:ReceiveFromNativeEvent) => {

        //     console.log("it worked?")

        //     // e.respondWith(
        //     //     Promise.resolve('test')
        //     // )
        // })
        // setTimeout(() => {
        //     this.sendToNative("test", {one: "two"})
        //     .then((response) => {
        //         console.log('promise response', response);
        //     })
        // }, 100)
        
        
    }

    register(url: URL, options: ServiceWorkerRegistrationOptions = {}) : Promise<void> {
        return this.sendToNative("register", [url, options]);
    }

    getRegistrations() : Promise<[ServiceWorkerRegistration]> {
        return this.sendToNative("getRegistrations");
    }

}

registerClass("ServiceWorkerContainer", ServiceWorkerContainer);