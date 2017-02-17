import { SerializedConnectedItem }  from '../deserializer/deserialize-types';
import { NativeItemProxy } from './native-item-proxy';
import { sharedStorage } from '../shared-storage/shared-storage';
import { DispatchToNativeEvent } from './dispatch-to-native-event';

if (!sharedStorage.connectedItems) {

    // ensure we are running with a clean slate.
    new DispatchToNativeEvent("clearbridgeitems", null).dispatchAndResolve();
    sharedStorage.connectedItems = [];

}

let connectedItems: NativeItemProxy[] = sharedStorage.connectedItems;
let registeredClasses: { [className: string] : any } = {};

export function addItem(item: NativeItemProxy): number {
    connectedItems.push(item);
    return connectedItems.length - 1;
}

export function registerClass(name: string, classObj:any) {
    registeredClasses[name] = classObj;
}

export function dispatchTargetedEvent(target: NativeItemProxy, name: String, data: any) {

    let itemIndex = getIndexOfItem(target);

    
    if (itemIndex === -1) {
        throw new Error("Item is not in our collection of connected items.")
    }

    console.info(`Dispatching event "${name}" to connected ${target.constructor.name} (#${itemIndex})`)


    let nativeEvent = { name, data };

    let ev = new DispatchToNativeEvent("sendtoitem", nativeEvent, itemIndex);

    return ev.dispatchAndResolve();
}

function createItem(item: SerializedConnectedItem) {

    let classToCreate = registeredClasses[item.jsClassName];

    if (!classToCreate) {
        throw new Error(`Tried to create an instance of class ${item.jsClassName} but it wasn't registered`)
    }

    if (connectedItems[item.index]) {
        throw new Error("Item already exists at index #" + item.index);
    }

    let newInstance = new classToCreate(item.index, item.initialData) as NativeItemProxy;

    connectedItems[item.index] = newInstance;

    return newInstance;
}

function getExistingItem(item: SerializedConnectedItem) {

    let existingItem = connectedItems[item.index];

    if (!existingItem) {
        throw new Error("Item does not exist at index #" + item.index);
    }

    return existingItem;

}

export function processSerializedItem(item: SerializedConnectedItem) {
    
    if (item.existing === true) {
        return getExistingItem(item);
    } else {
        return createItem(item);
    }
}

export function getIndexOfItem(item: NativeItemProxy):number {

    return connectedItems.indexOf(item);

}

