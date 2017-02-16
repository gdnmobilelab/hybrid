import {serviceWorkerBridge, ServiceWorkerContainer} from './sw-manager';
import './receive-message';

let navigatorAsAny:any = navigator;

navigatorAsAny.serviceWorker = ServiceWorkerContainer;