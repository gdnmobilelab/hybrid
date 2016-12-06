const fetch = require('node-fetch');

function processCache(sw, key) {
    return sw.caches.open(key)
    .then((cache) => cache.keys())
    .then((entryKeys) => {

        let fetchPromises = entryKeys.map((key) => {
            return fetch(key)
            .then((res) => {
                return res.buffer()
                .then((buffer) => {

                    let headers = {};

                    Object.keys(res.headers._headers).forEach((key) => {
                        headers[key] = res.headers.getAll(key)
                    })


                    return {
                        buffer: buffer,
                        headers: headers,
                        url: key,
                        status: res.status
                    }
                })
            })
        });

        return Promise.all(fetchPromises);
    })
    .then((resolvedFetches) => {
        return {
            name: key,
            entries: resolvedFetches
        }
    })
}

module.exports = function(sw) {
    return sw.caches.keys()
    .then((keys) => {
        let processPromises = keys.map((key) => processCache(sw, key))
        return Promise.all(processPromises);
    })
}
