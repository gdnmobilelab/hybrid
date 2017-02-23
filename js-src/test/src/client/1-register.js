const assert = require('assert');
const iframeWrapper = require('./utils/make-iframe');

test.skip("Register Service Worker", function(t) {

    return iframeWrapper.withIframe('/static-worker/load.html', (iframe) => {
        let sw = iframe.contentWindow.navigator.serviceWorker;

        return sw.register('/static-worker/worker.js', {scope: '/static-worker/'})
        .then((reg) => {
           
            t.equal(reg.constructor.name, "ServiceWorkerRegistration", "Register should return a ServiceWorkerRegistration object");
            t.ok(reg.installing, "Service worker should be in installing status");


            let expectedStateIndex = 0;

            return new Promise((fulfill, reject) => {

                let readyHasRun = false;

                sw.ready.then((reg) => {
                    t.ok(reg.active, "Worker should be in the active slot")
                    t.equal(reg.active.state, "activating", "Active worker should have activating state during ready promise");
                    t.equal(reg.constructor.name, "ServiceWorkerRegistration", "Ready promise should return a ServiceWorkerRegistration object");
                    
                    readyHasRun = true;

                })
                .catch((err) => {
                    t.error(err);
                })

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

                    if (expectedStateIndex === expectedStates.length) {
                        installingReg.onstatechange = null
                        t.ok(readyHasRun, "Service worker ready promise should fulfill just before the worker sets to active")
                        fulfill();
                    }
                }
            })
           
        })
    })
})