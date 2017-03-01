import { NativeItemProxy } from '../bridge/native-item-proxy';

function makeSuitable(val:any) {
    if (val instanceof Error) {
        return val.toString();
    } else if (typeof val == "string") {
        return val;
    } else if (val === null || val === undefined) {
        return "null"
    } else {
        let returnString = "(not stringifyable): "
        try {
            returnString = JSON.stringify(val);
        } catch (err) {
            returnString += err.toString()
        }
        return returnString
    }
};

let levels = ['debug','info', 'log', 'error', 'warn'];


export const notNativeConsole:any = {
};

levels.forEach((level) => {
    notNativeConsole[level] = console[level].bind(console);
})

export class ConsoleInterceptor extends NativeItemProxy {

    constructor(targetConsole:any) {
        super();

        targetConsole.doNotEmitToNative = {};
        
        levels.forEach((level) => {
            notNativeConsole[level] = targetConsole[level].bind(targetConsole);
            this.createInterceptor(targetConsole, level);
        })

    }

    getArgumentsForNativeConstructor(): any[] {
        return [];
    }

    createInterceptor(obj:any, key: string) {

        let originalLog = obj[key];
        let self = this;

        // We use this to stop forming infinite loops
        obj.doNotEmitToNative[key] = obj[key].bind(obj);

        obj[key] = function() {

            originalLog.apply(obj, arguments);

            let suitableArguments = [].slice.call(arguments).map(makeSuitable);
            self.emitJSEvent(key, suitableArguments, false);

        }

        

    }

}
