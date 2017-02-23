import EventEmitter from 'eventemitter3';
import { DispatchToNativeEvent } from './dispatch-to-native-event';
import { runCommand, sendToNative } from './bridge';
import { CreateBridgeItemCommand, BridgeItemEventCommand } from './bridge-commands';
import { notNativeConsole } from '../global/console';

export abstract class NativeItemProxy {

    constructor() {
        this.emitJSEvent = this.emitJSEvent.bind(this);
    }

    nativeEvents = new EventEmitter();

    emitJSEvent(name: string, data: any = null, waitForPromiseReturn:boolean = true) : Promise<any> {

        let cmd:BridgeItemEventCommand = {
            commandName: "itemevent",
            target: this,
            eventName: name,
            data: data
        };
        
        let dispatchEvent = new DispatchToNativeEvent("sendtoitem",cmd);

        // notNativeConsole.info(`Dispatching "${name}" event into native environment...`)
        if (waitForPromiseReturn) {
            return dispatchEvent.dispatchAndResolve();
        } else {
            dispatchEvent.dispatch();
            return Promise.resolve();
        }
    }

    abstract getArgumentsForNativeConstructor(): any[];

}

interface EventConstructor {
    type: string;
    target: any;
}

export abstract class NativeItemProxyWithEvents extends NativeItemProxy {

    events = new EventEmitter();

    addEventListener(name: string, listener: Function) {
        this.events.on(name, listener);
    }

    removeEventListener(name: string, listener: Function) {
        this.events.off(name, listener);
    }

    dispatchEvent(ev:EventConstructor) {
        this.events.emit(ev.type, ev);
    }

}