const assert = require('assert');

function clearAllRegistrations(sw) {
    return sw.getRegistrations()
    .then((allRegistrations) => {
        // clear out any existing workers
        return Promise.all(allRegistrations.map((r) => r.unregister()))
    })
}

test("Register Service Worker", function(t) {

    let iframe;
    let sw;

    return Promise.resolve()
    .then(() => {

        // Putting it inside an iframe allows us to isolate worker events
        // from the testing itself

        iframe = document.createElement('iframe');
        iframe.src = '/static-worker/load.html';

        return new Promise((fulfill, reject) => {
            iframe.onload = function() {
                fulfill(iframe);
            }

            document.body.appendChild(iframe);
        });
        

    })
    .then((iframe) => {

        sw = iframe.contentWindow.navigator.serviceWorker;

        const cleanup = (valuePassedIn) => {
            return clearAllRegistrations(sw)
            .catch(() => {
               return Promise.resolve();
            })
            .then(() => {
                if (valuePassedIn instanceof Error) {
                    throw valuePassedIn;
                }
            })
            
        }

        return clearAllRegistrations(sw)
        .then(() => {
            return sw.register('/static-worker/worker.js', {scope: '/static-worker/'});
        })
        .then((reg) => {
            t.ok(reg.installing, "Service worker should be in installing status");

            

            let expectedStateIndex = 0;

            return new Promise((fulfill, reject) => {

                let readyHasRun = false;

                sw.ready.then((reg) => {
                   
                    readyHasRun = true;
                   
                    try {
                        t.equal(reg.toString(),"[object ServiceWorkerRegistration]", "ready promise should return a registration");
                    } catch (err) {
                        reject(err)
                    }
                });

                let expectedStates = [
                    'installed',
                    'activating',
                    'activated'
                ];

                let installingReg = reg.installing

                installingReg.onstatechange = function(e) {
                    try {
                        t.equal(e.target.state, expectedStates[expectedStateIndex], "Status should be " + expectedStates[expectedStateIndex]);
                    } catch (err) {
                        reject(err);
                    }
                    expectedStateIndex++;

                    if (expectedStateIndex === expectedStates.length - 1) {
                        installingReg.onstatechange = null
                        fulfill();
                    }
                }

                

            })
           
        })
    })
    .always(() => {
        return clearAllRegistrations(sw)
        .then(() => {
            document.body.removeChild(iframe);
        })
    })
})