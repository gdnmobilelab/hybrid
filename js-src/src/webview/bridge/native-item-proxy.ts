import EventEmitter from 'eventemitter3';
import { getIndexOfItem, addItem } from './connected-items';
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
        .then(() => {
            console.log('WORKED?!?')
        })
        .catch((err) => {
            console.error(err)
        })
    }

    protected sendToNative(name: String, data: any = null): Promise<any> {

        return this.nativeIdFetch
        .then((id) => {
            if (id === -1) {
                throw new Error("Trying to send to native but we're not registered. Are you doing this in the constructor? Don't.")
            }

            let nativeEvent = { name, data };

            let ev = new DispatchToNativeEvent("sendtoitem", nativeEvent, id);

            return ev.dispatchAndResolve();
        })
        
    }

}
