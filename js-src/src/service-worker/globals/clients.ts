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
    console.log("MATCH ALL")
    return new Promise((fulfill, reject) => {
        clients.matchAllCallback(options, (err:Error, result:any) => {
            if (err) {
                return reject(err);
            }
            fulfill(result);
        })
    });
};

(clients as any).openWindow = function(url:string) {
    console.log("OPEN WINDOW")
    return new Promise((fulfill, reject) => {
        clients.openWindowCallback(url, () => {
            fulfill();
        })
    })
};

(self as any).clients = clients;