import { DispatchToNativeEvent } from './dispatch-to-native-event';
import { SerializedConnectedItem }  from '../deserializer/deserialize-types';
import { NativeItemProxy } from './native-item-proxy';
import { sharedStorage } from '../shared-storage/shared-storage';
import { deserialize } from '../deserializer/deserialize';

let connectedItems: { [id: string] : NativeItemProxy} = {};
let registeredClasses: { [className: string] : any } = {};

export function manuallyAddItem(index:number, item:NativeItemProxy) {
    console.info(`Manually adding instance of ${item.constructor.name} at index ${index}`)
    connectedItems[index] = item;
}

export function registerClass(name: string, classObj:any) {
    console.info(`Registering ${name} as a native proxy class`);
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

    // Our custom item declaration isn't made of serialized values in the same way other stuff is.
    // However, the initialData argument *is*, since we don't know what will be passed in.
    let initialData:any[] = deserialize(item.initialData)

    // Creating a new instance via apply:
    // http://stackoverflow.com/questions/1606797/use-of-apply-with-new-operator-is-this-possible

    // first argument is ignored
    initialData.unshift(null);

    let newInstance = new (Function.prototype.bind.apply(classToCreate, initialData)) as NativeItemProxy;

    connectedItems[item.index] = newInstance;

    console.info(`Created an instance of ${item.jsClassName} at index #${item.index}`)

    return newInstance;
}

function getExistingItem(item: SerializedConnectedItem) {

    let existingItem = connectedItems[item.index];

    if (!existingItem) {
        console.error(connectedItems);
        throw new Error(`Item of type ${item.jsClassName} does not exist at index #` + item.index);
        
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

    for (let key in connectedItems) {
        if (connectedItems[key] === item) {
            return parseInt(key, 10)
        }
    }

    return -1;

}

