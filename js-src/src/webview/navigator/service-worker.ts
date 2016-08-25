import {serviceWorkerBridge, ServiceWorkerContainer} from './sw-manager';

let navigatorAsAny:any = navigator;

navigatorAsAny.serviceWorker = ServiceWorkerContainer;