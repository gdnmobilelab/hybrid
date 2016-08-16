import {sendAndReceive} from '../util/wk-messaging';
import {serviceWorkerBridge, ServiceWorkerContainer} from './sw-manager';

let navigatorAsAny:any = navigator;

navigatorAsAny.serviceWorker = ServiceWorkerContainer;