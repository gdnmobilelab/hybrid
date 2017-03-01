import { DispatchToNativeEvent } from './dispatch-to-native-event';
import { deserialize } from '../deserializer/deserialize';
import { BridgeCommand, BridgeItemEventCommand, RegisterItemCommand, ResolvePromiseCommand } from './bridge-commands';
import { NativeItemProxy } from './native-item-proxy';
import { Serialized } from '../deserializer/deserialize-types';
import { ReceiveFromNativeEvent } from './receive-from-native-event';
import { serialize } from '../deserializer/serialize';
import { notNativeConsole } from '../global/console';

import { ServiceWorkerContainer } from '../navigator/service-worker-container';
import { ConsoleInterceptor } from '../global/console';

import { register } from '../register-to-window';

const hybridHandler = (window.top as any).webkit.messageHandlers.hybrid;

class Bridge {

    attachToWindow(window:Window) {
        register(window);
        (window.navigator as any).serviceWorker = new ServiceWorkerContainer(window);
        // new ConsoleInterceptor(console);
    }

    sendToNative(data:any) {
        serialize(data)
        .then((serializedData) => {
            hybridHandler.postMessage(serializedData);
        })
        .catch((err) => {
            console.error(err);
        })
    }

    runCommand(instruction: BridgeCommand):any {
        
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
            let deserializedData = itemEvent.eventData;

            let event = new ReceiveFromNativeEvent(itemEvent.eventName, deserializedData);

            // console.info(`Dispatching event ${itemEvent.eventName} in`, deserializedItem);
            
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

    deserializeAndRunCommand(command:Serialized):any {
        let instruction = deserialize(command);

        return this.runCommand(instruction);

    }
}

export let bridge = new Bridge();
hybridHandler.bridge = bridge;
hybridHandler.receiveCommand = bridge.deserializeAndRunCommand.bind(bridge);