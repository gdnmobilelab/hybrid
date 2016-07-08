import events from 'events';
import Promise from 'es6-promise';

let emitter = new events.EventEmitter();

self.addEventListener = emitter.addListener.bind(emitter);
self.emit = emitter.emit.bind(emitter)

self.promiseBridge = function(callbackIndex, promise) {
    promise
    .then((response) => {
        __promiseCallback(callbackIndex, null, response)
    })
    .catch((err) => {
        __promiseCallback(callbackIndex, err.message)
    })
}