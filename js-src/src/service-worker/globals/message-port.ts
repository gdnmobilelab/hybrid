
class HybridMessagePort {

    _port: __MessagePort

    constructor() {
        this._port = new __MessagePort();
        this._port.onmessage = this.receiveMessage
    }

    onmessage:Function

    postMessage(message:any, ports: MessagePort[]) {
        this._port.postMessage(JSON.stringify(message), ports);
    }

    private receiveMessage(ev:MessageEvent) {
        if (!this.onmessage) {
            return
        }
        ev.data = JSON.parse(ev.data);
        this.onmessage(ev);
    }
}

global.MessagePort = HybridMessagePort;