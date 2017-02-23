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
import { initializeStore } from './bridge/connected-items';
initializeStore();

import { ConsoleInterceptor } from './global/console';

new ConsoleInterceptor(console);

import { deserialize } from './deserializer/deserialize';
import { runCommand } from './bridge/bridge';
import { BridgeCommand } from './bridge/bridge-commands';
import { ServiceWorkerContainer } from './navigator/service-worker-container';
import './register-to-window';

// If this is a page reload, we might still have bridge items cached
// on the native side. Just to be sure, clear them out.

(navigator as any).serviceWorker = new ServiceWorkerContainer();



(window as any).shimDidLoad = true;