import { SerializedConnectedItem }  from '../deserializer/deserialize-types';
import { NativeItemProxy } from './native-item-proxy';
import { sharedStorage } from '../shared-storage/shared-storage';

if (!sharedStorage.connectedItems) {
    sharedStorage.connectedItems = [];
}

let connectedItems: NativeItemProxy[] = sharedStorage.connectedItems;
let registeredClasses: { [className: string] : any } = {};

export function registerClass(name: string, classObj:any) {
    registeredClasses[name] = classObj;
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