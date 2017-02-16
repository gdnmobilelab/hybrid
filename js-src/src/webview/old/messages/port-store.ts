import {MessagePortWrapper} from './message-channel';

const activeMessagePorts:MessagePortWrapper[] = []

const PortStore = {

    add: function (port:MessagePortWrapper) {
        if (activeMessagePorts.indexOf(port) > -1) {
            throw new Error("Trying to add a port that's already been added");
        }
        activeMessagePorts.push(port);
    },

    remove: function (port:MessagePortWrapper) {
        activeMessagePorts.splice(activeMessagePorts.indexOf(port), 1);
    },

    findByNativeIndex: function(nativeIndex:number):MessagePortWrapper {
        let existing = activeMessagePorts.filter((p) => p.nativePortIndex === nativeIndex);
        return existing[0];
    },

    findOrCreateByNativeIndex: function(nativeIndex:number):MessagePortWrapper {
        if (!nativeIndex && nativeIndex !== 0) {
            throw new Error("Must provide a native index")
        }
      
        let existing = PortStore.findByNativeIndex(nativeIndex);

        if (existing) {
            // Already have a port for this. Return it.
            return existing;
        }

        // If not, make a new one

        let newCustom = new MessagePortWrapper();
        newCustom.nativePortIndex = nativeIndex;
        console.debug("Created new web MessagePort for native index", nativeIndex)
        
        // this already has a bridge, so we consider it 'active'
        PortStore.add(newCustom);
        return newCustom
    },

    findOrWrapJSMesssagePort: function(port:MessagePort): MessagePortWrapper {
        let existing = activeMessagePorts.filter((p) => p.jsMessagePort == port);

        if (existing.length == 1) {
            // Already have a port for this. Return it.
            return existing[0];
        }

        let newCustom = new MessagePortWrapper(port);

        // this has not yet been given a native index, so we do not
        // consider it active.

        return newCustom;
    }
}

export default PortStore;

// for testing
(window as any).hybridPortStore = PortStore;