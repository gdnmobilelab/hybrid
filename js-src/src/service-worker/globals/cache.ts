import {storePromiseResult} from '../hybrid/promise-bridge';

class CacheInstance {

    name:String;

    constructor(name:String) {
        this.name = name;
    }

    addAll(urls:[String]) {
        return new Promise((fulfill, reject) => {
            let promiseIndex = storePromiseResult(fulfill, reject);
            
            __cacheOperation(promiseIndex, "addAll", this.name, [urls]);

        })
    }

    add(url:String) {
        return this.addAll([url]);
    }

    match(url:String) {
        return new Promise((fulfill, reject) => {
            let promiseIndex = storePromiseResult(fulfill, reject);
            __cacheOperation(promiseIndex, "match", this.name, [url]);
        })
        .then((cacheResponse:string) => {
            
            console.log("response?", cacheResponse)
            if (!cacheResponse) {
                throw new Error("Entry does not exist in cache.")
            }
            
            let response = {
                url: url,
                status: 0,
                __hybridCacheResponse: JSON.parse(cacheResponse)
            }

            return response;
        })
    }
}


global.caches = {
    open: function(id:String):Promise<CacheInstance> {
        return Promise.resolve(new CacheInstance(id))
    }
}