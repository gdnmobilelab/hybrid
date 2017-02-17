import { SerializedConnectedItem, Serialized } from '../deserializer/deserialize-types';
import { NativeItemProxy } from './native-item-proxy';

export interface BridgeCommand {
    commandName: "itemevent" | "resolvepromise" | "registerItem" | "createbridgeitem";
}

export interface BridgeItemEventCommand extends BridgeCommand {
    target: NativeItemProxy;
    data: any;
    eventName: string;
}

export interface CreateBridgeItemCommand extends BridgeCommand {
    className: string;
    createArguments: any[];
}

export interface RegisterItemCommand extends BridgeCommand {
    item: SerializedConnectedItem;
    path: string[];
    name: string;
}

export interface ResolvePromiseCommand extends BridgeCommand {
    promiseId:number;
    error:string;
    data: any;
}

export interface ItemCommand {
    command: string;
    target: NativeItemProxy;
    data: any;
}