const stringToErr = function(reject:Function) {
    return (err: string) => {
        reject(new Error(err));
    }
    
}

caches.open = function(name:String): Promise<Cache> {
    return new Promise((fulfill, reject) => {
        caches.openCallbackSuccessFailure(name, fulfill, stringToErr);
    })
}

Cache.prototype.add = function(url:string) {
    return new Promise<void>((fulfull, reject) => {
        Cache.prototype.addCallbackSuccessFailure.apply(this, [url, fulfull, stringToErr(reject)]);
    })
}

Cache.prototype.addAll = function(urls: string[]) {
    return new Promise<void>((fulfull, reject) => {
        Cache.prototype.addAllCallbackSuccessFailure.apply(this, [urls, fulfull, stringToErr(reject)]);
    })
}

Cache.prototype.match = function(request:any) {
    return new Promise<void>((fulfull, reject) => {
        console.log('request', request, request.prototype)
        Cache.prototype.matchCallbackSuccessFailure.apply(this, [request, fulfull, stringToErr(reject)]);
    })
}