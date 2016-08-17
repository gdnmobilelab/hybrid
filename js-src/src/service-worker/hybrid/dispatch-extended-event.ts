
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
    
    let respondWithEvent = new FetchEvent({
        request: data
    });

    self.dispatchEvent(respondWithEvent);

    return respondWithEvent.resolve()
}

hybrid.dispatchMessageEvent = function(message:string, ports: [MessagePort]) {
    let ev = {
        type: "message",
        ports: ports,
        data: JSON.parse(message)
    }

    self.dispatchEvent(ev as MessageEvent);
}