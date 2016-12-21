import {PromiseOverWKMessage} from '../util/promise-over-wkmessage';
import PortStore from './port-store';
import PromiseTools from 'promise-tools';

let webkit = (window as any).webkit;

const promiseBridge = new PromiseOverWKMessage("messageChannel");

// We need this to be globally accessible so that we can trigger receive
// events manually

(window as any).__messageChannelBridge = promiseBridge;

interface MessagePortMessage {
    data:string,
    passedPortIds: number[]
}

function receiveMessage(portIndex:number, message:MessagePortMessage) {
    try {
        console.debug("Received incoming message from native, to port", portIndex);
        let thisPort = PortStore.findOrCreateByNativeIndex(portIndex);

        if (!thisPort) {
            throw new Error("Tried to receive message on inactive port");
        }

        let mappedPorts = message.passedPortIds.map((id) => {
            // We can't pass in actual message ports, so instead we pass in
            // their IDs. Now we map them to our wrapper CustomMessagePort
            return PortStore.findOrCreateByNativeIndex(id).jsMessagePort;
        })
        
        console.debug("Posting message to native index", thisPort.nativePortIndex);
        thisPort.sendOriginalPostMessage(message.data, mappedPorts);
    } catch (err) {
        console.error(err)
    }

}

promiseBridge.addListener("emit", receiveMessage);

promiseBridge.addListener("delete", (index:number) => {
    console.debug("Deleting port store entry at index", index);
    let port = PortStore.findByNativeIndex(index);
    PortStore.remove(port);
})

export class MessagePortWrapper {

    open:boolean;
    nativePortIndex:number;
    jsMessagePort:MessagePort;
    jsMessageChannel:MessageChannel;
    private originalJSPortClose:Function;

    constructor(jsPort:MessagePort = null) {
        this.nativePortIndex = null;
        if (jsPort) {
            console.debug("Creating wrapper for an existing MessagePort")
            this.jsMessagePort = jsPort

            // disgusting hack, but can't see any way around is as there is no
            // "has dispatched a message" event, as far as I can tell 

            this.jsMessagePort.postMessage = this.handleJSMessage.bind(this);
        } else {
            console.debug("Making wrapper for a new web MessagePort")
            
            // we can't create a MessagePort directly, so we have to make
            // a channel then take one port from it. Kind of a waste.
            
            this.jsMessageChannel = new MessageChannel();
            this.jsMessagePort = this.jsMessageChannel.port1;

            this.jsMessageChannel.port2.onmessage = (ev:MessageEvent) => {
                // we can't reliably hook into postMessage, so we use this
                // to catch postMessages too. Need to document all this madness.
                this.handleJSMessage(ev.data, ev.ports);
            }
        }

        // Same for the lack of a 'close' event.
        this.originalJSPortClose = this.jsMessagePort.close;
        // this.jsMessagePort.close = this.close;
    }

    sendOriginalPostMessage(data: any, ports: MessagePort[]) {
        MessagePort.prototype.postMessage.apply(this.jsMessagePort, [data, ports]);
    }

    handleJSMessage(data:any, ports: MessagePort[], isExplicitPost:boolean = false) {
        console.debug("Posting new message...")
       
        // Get our custom port instances, creating them if necessary
        let customPorts:MessagePortWrapper[] = [];
        
        if (ports) {
            customPorts = ports.map((p:MessagePort) => PortStore.findOrWrapJSMesssagePort(p));
        }

        this.checkForNativePort()
        .then(() => {
            // if they were created, then we need to assign them a native ID before
            // we send.
            console.debug("Checking that additional ports have native equivalents")
            return PromiseTools.map(customPorts, (port:MessagePortWrapper) => port.checkForNativePort()) as Promise<any>
        })
        .then(() => {

            // If this is an explicit postMessage call, we need the native
            // side to pick up on it (so it does something with the MessagePort)

            promiseBridge.bridgePromise({
                operation: "sendToPort",
                portIndex: this.nativePortIndex,
                data: JSON.stringify(data),
                isExplicitPost: isExplicitPost,
                additionalPortIndexes: customPorts.map((p) => p.nativePortIndex)
            })
        })
        .catch((err) => {
            console.error(err);
        })
    }

    checkForNativePort(): Promise<any> {
        if (this.nativePortIndex !== null) {
            //console.debug("Port already has native index", this.nativePortIndex)
            return Promise.resolve();
        }
        return promiseBridge.bridgePromise({
            operation: "create"
        })
        .then((portId:number) => {
            console.debug("Created new native MessagePort at index ", String(portId))
            this.nativePortIndex = portId;

            // only add to our array of active channels when
            // we have a native ID
            PortStore.add(this);
            
        })
    }

    // close() {

    //     // run the original function we overwrote
    //     this.originalJSPortClose.apply(this.jsMessagePort);
        
    //     // remove from our cache of active ports
    //     PortStore.remove(this);
     
    //     // finally, tell the native half to delete this reference.
    //     promiseBridge.bridgePromise({
    //         operation: "delete",
    //         portIndex: this.nativePortIndex
    //     })
    // }
}

export function postMessage(message:any, ports: [MessagePort]) {

    let portIndexes:number[] = [];

    Promise.resolve()
    .then(() => {

        return PromiseTools.map(ports, (port:MessagePort) => {
            let wrapper = new MessagePortWrapper(port);
            return wrapper.checkForNativePort()
            .then(() => {
                return wrapper.nativePortIndex;
            })
        })
    })
    .then((portIndexes:number[]) => {
        promiseBridge.bridgePromise({
            operation: "postMessage",
            data: JSON.stringify(message),
            additionalPortIndexes: portIndexes
        })
    })
    

    

}