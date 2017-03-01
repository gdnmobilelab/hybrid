const iframeWrapper = require('./utils/make-iframe');

test("Registering multiple scopes", function(t) {
    return iframeWrapper.withIframe('/multiple-scopes/parent/child/load.html', (iframe) => {

        let sw = iframe.contentWindow.navigator.serviceWorker;

        sw.register('/multiple-scopes/parent/worker.js')
        .catch((err) => {
            t.error(err);
        })

        return sw.ready.then((reg) => {
            t.equal(reg.scope, "http://localhost:9000/multiple-scopes/parent/", "Scope should reflect parent directory");


            return iframeWrapper.withIframe('/multiple-scopes/parent/load.html', (childIframe) => {
                return new Promise((fulfill, reject) => {

                    
                  
                    sw.oncontrollerchange = function(e) {
                        t.equal(e.target.constructor.name, "ServiceWorkerContainer", "Target of controllerchange event should be ServiceWorkerContainer")
                        t.equal(sw.controller.scriptURL, 'http://localhost:9000/multiple-scopes/parent/child/worker.js', "New worker URL should be child/worker.js");
                        fulfill();
                    }

                    
                    let childSw = childIframe.contentWindow.navigator.serviceWorker;
                    t.equal(childSw.controller.scriptURL, 'http://localhost:9000/multiple-scopes/parent/worker.js', "New frame should preload active worker into controller slot")
                    childSw.register('/multiple-scopes/parent/child/worker.js');

                })

            })

            

        })
    }, {timeout: 2000})
})