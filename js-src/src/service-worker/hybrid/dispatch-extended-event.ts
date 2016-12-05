import {PushEvent} from '../globals/extended-event-types';

hybrid.dispatchExtendableEvent = function(extendedEvent:any, cb:any) {

    let promise = Promise.resolve()
    .then(() => {
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

// hybrid.dispatchMessageEvent = function(message:string, ports: [MessagePort]) {
//     let ev = {
//         type: "message",
//         ports: ports,
//         data: JSON.parse(message)
//     }
//     self.dispatchEvent(ev as MessageEvent);
// }