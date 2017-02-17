import { deserialize } from '../deserializer/deserialize';
import { BridgeCommand, BridgeItemEventCommand, RegisterItemCommand, ResolvePromiseCommand } from './bridge-commands';
import { processSerializedItem } from './connected-items';
import { NativeItemProxy } from './native-item-proxy';
import { Serialized } from '../deserializer/deserialize-types';
import { ReceiveFromNativeEvent } from './receive-from-native-event';
import { DispatchToNativeEvent } from './dispatch-to-native-event';

let windowTarget: any = window;

if (window.top !== window && window.top.location.href) {
    // href check makes sure we have same-origin permissions. If we don't
    // we're kind of screwed.
    console.info("We appear to be running inside a frame, referencing the parent handler.")
    windowTarget = window.top;
}

const hybridHandler = (windowTarget).webkit.messageHandlers.hybrid;

if (window.top === window) {
    hybridHandler.receiveCommand = deserializeAndRunCommand;
}

export function sendToNative(data:any) {

    hybridHandler.postMessage(data);
}

export function runCommand(instruction: BridgeCommand):any {

    console.log("Running command", instruction)

    if (instruction.commandName === "resolvepromise") {

        // When a DispatchToNativeEvent dispatches, it sends alone a numeric ID for the
        // promise that is awaiting resolving/rejecting. The native handler either waits
        // for a native promise to resolve or immediately resolves this promise via the
        // resolvepromise command.

        let asResolve = instruction as ResolvePromiseCommand;
     
        DispatchToNativeEvent.resolvePromise(asResolve.promiseId, asResolve.data, asResolve.error);

    }

    if (instruction.commandName === "itemevent") {

        let itemEvent = (instruction as BridgeItemEventCommand);

        let deserializedItem = itemEvent.target as NativeItemProxy;
        let deserializedData = deserialize(itemEvent.data);

        let event = new ReceiveFromNativeEvent(itemEvent.eventName, deserializedData);

        console.info(`Dispatching event ${itemEvent.eventName} in`, deserializedItem);
        
        deserializedItem.nativeEvents.emit(itemEvent.eventName, event);

        return event.metadata;
        
    } else if (instruction.commandName === "registerItem") {

        let registerCommand = instruction as RegisterItemCommand;

        let target = window as any;

        registerCommand.path.forEach((key) => {

            // Go through the path keys, grabbing the correct target object

            target = target[key];
        })

        console.info(`Registering`, registerCommand.item, `as ${registerCommand.name} on`, target);

        target[registerCommand.name] = registerCommand.item;

    }
}

function deserializeAndRunCommand(command:Serialized):any {

    let instruction = deserialize(command);

    return runCommand(instruction);

}