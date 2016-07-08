// import 'whatwg-fetch';
import './util/override-logging';
import {resolve} from 'path-browserify';
import {sendAndReceive} from './util/wk-messaging';


navigator.serviceWorker = {
    register: function(swPath, opts = {}) {
        
        
        
        let pathToSW = window.location.origin + resolve(window.location.pathname, swPath); 
    
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

        // fetch("http://localhost:" + HANDLER_PORT + "/sw/register", {
        //     method: "POST",
        //     body: JSON.stringify({
        //         url: pathToSW,
        //         scope: opts.scope
        //     })
        // })
        // .then((res) => res.json())
        // .then(function(json) {
        //       console.log("done?", json);
        // })
        // .catch((err) => {
        //     console.error(err, err.stack)
        // })
        
    }
}