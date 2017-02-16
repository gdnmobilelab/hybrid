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
import './navigator/service-worker-container';

if (__hybridRegisterCommands) {
    
    let parsedCommands = deserialize(__hybridRegisterCommands) as BridgeCommand[];
    console.info(`Found ${parsedCommands.length} register commands on load.`)
    
    parsedCommands.forEach(runCommand);

    __hybridRegisterCommands = undefined;
}

(window as any).shimDidLoad = true;