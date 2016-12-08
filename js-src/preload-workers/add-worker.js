const {ServiceWorker, ExtendableEvent} = require('node-service-worker');
const getCacheEntries = require('./get-cache-entries');
const fetch = require('node-fetch');


// We can use ${VARIABLE} subtitution in our JSON file, just like we can in
// plists and the like.
function injectVariablesIntoString(str) {
    let matcher = /\$\{(.+?)\}/

    return str.replace(matcher, (match, name, offset, wholeString) => {
        if (!process.env[name]) {
             throw new Error(`Tried to use environment variable ${name}, but it is not defined.`);
        }
        return process.env[name];
    })

}

module.exports = function({src, scope}) {
    let srcInjected = injectVariablesIntoString(src);
    let scopeInjected = injectVariablesIntoString(scope);
        
    console.log('Fetching worker for preload:', srcInjected)
    
    let checkTime = Date.now();

    return fetch(srcInjected)
    .then((res) => {
        return res.text()
        .then((fileContents) => {

            let worker = new ServiceWorker({
                scriptURL: srcInjected,
                scope: scopeInjected,
                contents: fileContents
            });

            let install = new ExtendableEvent("install");

            worker.dispatchEvent(install);

            return install.resolve()
            .then(() => {
                return getCacheEntries(worker)
            })
            .then((cacheEntries) => {

                return {
                    src: srcInjected,
                    headers: res.headers.raw(),
                    scope: scopeInjected,
                    contents: fileContents,
                    lastChecked: checkTime,
                    caches: cacheEntries
                }
            })
        })
    })
    
}