import EventEmitter from 'eventemitter3';
import { getIndexOfItem } from './connected-items';
import { DispatchToNativeEvent } from './dispatch-to-native-event';

export class NativeItemProxy {

    nativeEvents = new EventEmitter();

    protected sendToNative(name: String, data: any = null): Promise<any> {

        let id = getIndexOfItem(this);

        if (id === -1) {
            throw new Error("Trying to send to native but we're not registered. Are you doing this in the constructor? Don't.")
        }

        let nativeEvent = { name, data };

        let ev = new DispatchToNativeEvent("sendtoitem", nativeEvent, id);

        return ev.dispatchAndResolve();
    }

}
