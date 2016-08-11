import * as path from 'path-browserify';
import {sendAndReceive} from '../util/wk-messaging';
import {PromiseOverWKMessage} from '../util/promise-over-wkmessage';

const serviceWorkerBridge = new PromiseOverWKMessage("serviceWorker");

let navigatorAsAny:any = navigator;

navigatorAsAny.serviceWorker = {
    register: function(swPath:string, opts = {}) {
        
        let pathToSW = window.location.origin + path.resolve(window.location.pathname, swPath); 
        
        console.info("Attempting to register service worker at", pathToSW);

        return sendAndReceive({
            command: "navigator.serviceWorker.register",
            arguments: {
                path: swPath,
                options: opts
            }
        })
        .then((response) => {
            console.log("done?", response);
        })
    }
}