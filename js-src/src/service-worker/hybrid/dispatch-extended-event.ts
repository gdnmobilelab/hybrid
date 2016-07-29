
hybrid.dispatchExtendableEvent = function(name:string, data:Object) {
    let extendedEvent = new ExtendableEvent(name, data);

    return new Promise((fulfill, reject) => {
        try {
            self.dispatchEvent(extendedEvent);
            fulfill(extendedEvent.resolve());
        } catch (err) {
            reject(err);
        }
    })
    
}


hybrid.dispatchFetchEvent = function(data:Object) {
    let respondWithEvent = new FetchEvent("fetch", data);

    self.dispatchEvent(respondWithEvent);

    return respondWithEvent.resolve()
}