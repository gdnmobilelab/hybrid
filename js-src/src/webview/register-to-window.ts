import { ServiceWorkerRegistration } from './navigator/service-worker-registration';
import { ServiceWorkerContainer } from './navigator/service-worker-container';
import { ServiceWorker } from './navigator/service-worker';


export function register(window: any) {
    window.ServiceWorkerRegistration = ServiceWorkerRegistration;
    window.ServiceWorkerContainer = ServiceWorkerContainer;
    window.ServiceWorker = ServiceWorker;
}
