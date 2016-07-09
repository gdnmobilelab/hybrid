/// <reference path="./global-context.d.ts" />

import events from 'events';
import ES6 from 'es6-promise';
import {emitWithWaitUntil} from './wait-until'

let emitter = new events.EventEmitter();

let Promise = ES6.Promise;


// To stop the Typescript compiler complaining about us doing
// weird things

let selfAsAny = self as any;

selfAsAny.addEventListener = emitter.addListener.bind(emitter);
selfAsAny.emit = emitter.emit.bind(emitter)
selfAsAny.emitWithWaitUntil = emitWithWaitUntil.bind(emitter)

selfAsAny.promiseBridge = function(callbackIndex:Number, promise: Promise<any>) {
    promise
    .then((response) => {
        __promiseCallback(callbackIndex, null, response)
    })
    .catch((err) => {
        __promiseCallback(callbackIndex, err.message)
    })
}