(clients as any).claim = function() {
    return new Promise((fulfill, reject) => {
        clients.claimCallback((err:Error) => {
            if (err) {
                return reject(err);
            }
            fulfill();
        })
    })
};

(clients as any).matchAll = function(options: any) {
    return new Promise((fulfill, reject) => {
        clients.matchAllCallback(options, (err:Error, result:any) => {
            if (err) {
                return reject(err);
            }
            fulfill(result);
        })
    });
};

(clients as any).openWindow = function(url:string, options:any) {
    return new Promise((fulfill, reject) => {
        clients.openWindowOptionsCallback(url, options, () => {
            fulfill();
        })
    })
};

(self as any).clients = clients;

(Client.prototype as any).postMessage = function(message:any, ports: MessagePort[]) {
    Client.prototype.postMessagePortsCallback.apply(this, [JSON.stringify(message), ports, (err:Error) => {
        if (err) {
            throw err;
        }
    }])
}
