
hybrid.dispatchExtendableEvent = function(name:string, data:Object) {
    let extendedEvent = new ExtendableEvent(name, data);

    self.dispatchEvent(extendedEvent);

    return extendedEvent.resolve()
}


hybrid.dispatchFetchEvent = function(data:Object) {
    let respondWithEvent = new FetchEvent("fetch", data);

    self.dispatchEvent(respondWithEvent);

    return respondWithEvent.resolve()
}