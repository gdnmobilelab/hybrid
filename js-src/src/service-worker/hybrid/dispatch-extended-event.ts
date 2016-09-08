
hybrid.dispatchExtendableEvent = function(name:string, data:Object, cb:any) {
    
    console.log("HAS CALLBACK?", cb)
    

    let promise = Promise.resolve()
    .then(() => {
        let extendedEvent = new ExtendableEvent(name, data);
        self.dispatchEvent(extendedEvent);
        return extendedEvent.resolve();
    })
    
    if (cb) {
        promise = promise.then((result) => {
            cb.success(result);
        })
        .catch((err) => {
            cb.failure(err);
        })
    }
    
    return promise;
}


hybrid.dispatchFetchEvent = function(data:any) {
    return Promise.resolve()
    .then(() => {
          let respondWithEvent = new FetchEvent({
              request: data
          });

          self.dispatchEvent(respondWithEvent);
          return respondWithEvent.resolve();
    })
}

hybrid.dispatchMessageEvent = function(message:string, ports: [MessagePort]) {
    let ev = {
        type: "message",
        ports: ports,
        data: JSON.parse(message)
    }
    console.log("Received message", message);
    self.dispatchEvent(ev as MessageEvent);
}