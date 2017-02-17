// import './navigator/service-worker';
// import './console';
// import './messages/message-channel';
// import './util/generic-events';
// import './notification/notification';
// import './util/set-document-html';
// import './load-handler';

// window.onerror = function(err) {
//     console.error(err);
// }

// console.info("Webview layer load complete.")
import { deserialize } from './deserializer/deserialize';
import { runCommand } from './bridge/bridge';
import { BridgeCommand } from './bridge/bridge-commands';
import { ServiceWorkerContainer } from './navigator/service-worker-container';

// (navigator as any).serviceWorker = new ServiceWorkerContainer();

ServiceWorkerContainer.createWithBridge();

(window as any).shimDidLoad = true;