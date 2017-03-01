import { Serialized, SerializedValue, SerializedConnectedItem }  from './deserialize-types';
import { processSerializedItem } from '../bridge/connected-items';

function deserializeValue(asValue: SerializedValue) {
    if (asValue.value instanceof Array) {

        return (asValue.value as Serialized[]).map(deserialize);

    } else if (Object(asValue.value) === asValue.value) {

        let newObj:any = {};

        for (let key in asValue.value) {

            let serializedValue = deserialize(asValue.value[key]);
            newObj[key] = serializedValue;

        }

        return newObj;

    } else if (typeof asValue.value === "string" || typeof asValue.value === "number" || typeof asValue.value === "boolean" || asValue.value === null) {

        return asValue.value;

    } else {
        throw new Error("Could not deserialize this value")
    }
}

export function deserialize(serializedObject: Serialized): any {

    if (serializedObject == null) {
        return null;
    }

    if (serializedObject.type === "value") {

        return deserializeValue(serializedObject as SerializedValue);
        
    } else if (serializedObject.type === "connected-item") {
        
        return processSerializedItem(serializedObject as SerializedConnectedItem);

    } else {
        throw new Error("Did not know how to deserialize this");
    }

}