import { NativeItemProxy } from '../bridge/native-item-proxy';
import { registerClass } from '../bridge/connected-items';

export class ServiceWorkerRegistration extends NativeItemProxy {

};

registerClass("ServiceWorkerRegistration", ServiceWorkerRegistration);