import { ServiceWorkerRegistration } from './navigator/service-worker-registration';
import { ServiceWorkerContainer } from './navigator/service-worker-container';
import { ServiceWorker } from './navigator/service-worker';

let target = (window as any);

target.ServiceWorkerRegistration = ServiceWorkerRegistration;
target.ServiceWorkerContainer = ServiceWorkerContainer;
target.ServiceWorker = ServiceWorker;