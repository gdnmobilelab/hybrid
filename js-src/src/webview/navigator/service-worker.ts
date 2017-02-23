import { NativeItemProxyWithEvents } from '../bridge/native-item-proxy';
import { registerClass } from '../bridge/connected-items';
import { ReceiveFromNativeEvent } from '../bridge/receive-from-native-event';

export class ServiceWorker extends NativeItemProxyWithEvents {

    scriptURL:string;
    state:string;
    onstatechange:Function = undefined;

    constructor(scriptURL:string, state: string) {
        super();
       
        this.scriptURL = scriptURL;
        this.state = state;
        
        this.nativeEvents.on("statechange", this.processStateChange.bind(this));

        this.addEventListener("statechange", this.checkStateChangeObject.bind(this));
    }

    processStateChange(ev:ReceiveFromNativeEvent) {
        let newState = ev.data;

        this.state = newState;
       
        this.dispatchEvent({
            type: 'statechange',
            target: this
        });

    }

    // If we've manually set the onstatechange variable we need to call it.
    checkStateChangeObject(ev:Event) {
        // console.log('statechange?', this.onstatechange, this.onstatechange instanceof Function)
        if (this.onstatechange instanceof Function) {
            console.log("RUNNING FUNCTION")
            this.onstatechange(ev);
        }
    }

    getArgumentsForNativeConstructor() : any[] {
        throw new Error("Cannot be constructed on JS side")
    }

}

registerClass("ServiceWorker", ServiceWorker);