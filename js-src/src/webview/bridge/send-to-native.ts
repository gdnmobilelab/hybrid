
// We have a problem with iframes, because our native code can't run
// evaluateJavaScript() inside a frame - only the root frame. So we need
// to set up a handler that allows us to pass messages through the root frame
// and back into an iframe. (If we're in a root frame, we ignore all this)
export class SendToNative {

    postMessage:Function;
    frameIndex:number = -1;

    constructor(postMessage:Function) {
        this.postMessage = postMessage;
    }

    sendMessage(msg:any) {
        if (window.top === window) {
            this.postMessage(msg);
            return;
        } else {
            this.getFrameIndex()
        }
    }

    getFrameIndex() : Promise<number> {
        if (this.frameIndex !== -1) {
            return Promise.resolve(this.frameIndex);
        }

        let msgChannel = new MessageChannel();

        msgChannel.port2.onmessage = function() {
            
        }

        window.top.postMessage("getFrameIndex","*", [msgChannel.port1]);

    }
}

window.addEventListener('message', (e:MessageEvent) => {
    console.log(e);

    let targetWindowIndex = -1;

    while (targetWindowIndex < window.frames.length) {
        if (((window.frames as any)[targetWindowIndex]) === e.source) {
            break;
        }
        targetWindowIndex++;
    }

    console.log('idx?', targetWindowIndex);

})
