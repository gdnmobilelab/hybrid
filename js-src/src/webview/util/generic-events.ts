import {PromiseOverWKMessage} from '../util/promise-over-wkmessage';
import EventEmitter from 'eventemitter3';

let eventsBridge = new PromiseOverWKMessage("events");

(window as any).hybridEvents = {
    emit: function(name:String, data:String) {
        eventsBridge.send({
            name, data
        })
    }
}