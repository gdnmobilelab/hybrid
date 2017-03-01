import { NativeItemProxy } from '../bridge/native-item-proxy';
import { getIndexOfItem, manuallyAddItem } from '../bridge/connected-items';
import { DispatchToNativeEvent } from '../bridge/dispatch-to-native-event';
import { notNativeConsole } from '../global/console';

// If a proxy creation is already happening, we want to wait until
// it is complete before we run another, or we run into the danger
// of running the same operation twice.
let nativeProxyCreationCurrentlyHappening = Promise.resolve();

export function serialize(obj: any) : Promise<any> {
    
    if (obj === null) {
        return Promise.resolve(null);
    }
    
    else if (obj instanceof NativeItemProxy) {
        // is a native object

        let asNative = obj as NativeItemProxy;

        let name = (asNative.constructor as any).name;

        return nativeProxyCreationCurrentlyHappening
        .then(() => {

            let itemIndex = getIndexOfItem(obj);
        
            let retObj:any = {
                type: 'connected-item',
                existing: itemIndex > -1,
                jsClassName: name
            };

            if (itemIndex === -1) {

                notNativeConsole.warn(`Found new ${name} when serializing, manually creating link...`)

                retObj.initialData = asNative.getArgumentsForNativeConstructor();

                let ev = new DispatchToNativeEvent("connectproxyitem", retObj);
         
                // Not we set the waiting promise to be our new operation, to pause
                // all others.
                nativeProxyCreationCurrentlyHappening = ev.dispatchAndResolve()

                return nativeProxyCreationCurrentlyHappening.then((newIndex:number) => {

                    retObj.index = newIndex;
                    retObj.existing = true;

                    manuallyAddItem(newIndex, asNative);

                    return retObj;
                })


            } else {
                retObj.index = itemIndex;
                return Promise.resolve(retObj);
            }

        })

        

        

    }

    else if (obj instanceof Array) {

        let serializePromises = (obj as any[]).map((o) => serialize(o));

        return Promise.all(serializePromises)
        .then((serialized) => {
            return {
                type: 'value',
                value: serialized
            }
        })

    }

    else if (Object(obj) === obj) {

        let keys = Object.keys(obj);

        let serializePromises = keys.map((k) => serialize(obj[k]));

        return Promise.all(serializePromises)
        .then((serialized) => {
            
            let newObj:any = {};

            keys.forEach((key, idx) => {
                newObj[key] = serialized[idx];
            });

            return {
                type: 'value',
                value: newObj
            };

        })


        

        

    } else if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean" || obj === null) {
        return Promise.resolve({
            type: 'value',
            value: obj
        });
    } else {
        return Promise.reject(new Error("Do not know how to serialize this item"));
    }

}