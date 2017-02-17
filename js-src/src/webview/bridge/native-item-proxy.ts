import EventEmitter from 'eventemitter3';
import { addItem, dispatchTargetedEvent } from './connected-items';
import { DispatchToNativeEvent } from './dispatch-to-native-event';
import { runCommand } from './bridge';
import { CreateBridgeItemCommand } from './bridge-commands';

export class NativeItemProxy {

    nativeId: number = -1;
    nativeEvents = new EventEmitter();

    nativeIdFetch: Promise<number>;

    // constructor(nativeClassName: string, args:IArguments) {
        
    //     let ev = new DispatchToNativeEvent("createbridgeitem", {
    //         className: nativeClassName,
    //         args: [].slice.call(args)
    //     })

    //     this.nativeIdFetch = ev.dispatchAndResolve()
    //     .then((id) => {
    //         console.log('IIIDDD', id);
    //         // console.info(`Created native bridge for ${nativeClassName} with ID #${id}`);
    //         return id;
    //     })

    // }

    static createWithBridge() {

        let argArray = [].slice.call(arguments)
        let thisClass = (this as any);

        let instance = new thisClass(...argArray);

        let idx = addItem(instance);

        console.info(`Trying to register an instance of ${thisClass.name} at index #${idx}...`)
        let ev = new DispatchToNativeEvent("createbridgeitem", {
            itemIndex: idx,
            className: thisClass.name,
            args: argArray
        })

        ev.dispatchAndResolve()
        .catch((err) => {
            console.error(err)
        })

        return instance;
    }

    protected sendToNative(name: String, data: any = null): Promise<any> {

        return dispatchTargetedEvent(this, name, data);
        
    }

}
