import {ServiceWorkerContainer, serviceWorkerBridge} from './sw-manager';

serviceWorkerBridge.on("postMessage", (e:any) => {
    
    let message:string = e.arguments[0];
    let numberOfPorts:number = e.arguments[1];
   
    // We can't send MessagePorts across the bridge, so instead we create new
    // MessageChannels, listen for responses, then stringify and return them.

    let channels:MessageChannel[] = [];
    let channelResponses:any[] = [];

    for (let i = 0; i < numberOfPorts; i++) {
        let channel = new MessageChannel();
        channelResponses[i] = null;
        channel.port2.onmessage = function(msg) {
            console.log("RECEIVED PORT WRITE", i, msg.data)
            channelResponses[i] = msg.data;
        }
        channels.push(channel);
    }

    let portsToSend = channels.map((c) => c.port1);

    let ev = new MessageEvent("message", {
        data: message,
        ports: portsToSend
    });

    let promiseToResolve:Promise<any> = null;

    (ev as any).waitUntil = function(promise:Promise<any>) {
        promiseToResolve = promise;
    }
   
    ServiceWorkerContainer.dispatchEvent(ev);

    e.respondWith(
        Promise.resolve(promiseToResolve)
        .then(() => {
            return new Promise<any>((fulfill, reject) => {
                // We have to use a timeout because MessagePorts do not appear
                // to fire onmessage synchronously. But a 1ms timeout seems
                // to catch it.
                setTimeout(function() {
                    fulfill(channelResponses.map((r) => JSON.stringify(r)));
                },1)
            })
            
        })
    )
});