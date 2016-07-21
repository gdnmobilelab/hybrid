
hybrid.dispatchExtendableEvent = function(name:string, data:Object) {
    let extendedEvent = new ExtendableEvent(name, data);

    self.dispatchEvent(extendedEvent);

    return extendedEvent.resolve()
}


hybrid.dispatchFetchEvent = function(name:string, data:Object) {
    let respondWithEvent = new FetchEvent(name, data);

    self.dispatchEvent(respondWithEvent);

    return respondWithEvent.resolve()
}