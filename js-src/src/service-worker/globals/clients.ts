
class WebviewClientManagerWrapper {
    claim(): Promise<void> {
        return new Promise<void>((fulfill, reject) => {
            __WebviewClientManager.claim((err) => {
                if (err) {
                    return reject(new Error(err));
                }
                return fulfill();
            })
        })
    }
    matchAll(options:ServiceWorkerClientsMatchOptions): Promise<ServiceWorkerClient[]> {
        throw new Error("Not implemented yet")
    }
    openWindow(url:string): Promise<WindowClient> {
        throw new Error("Not implemented yet")
    }
}
(self as ServiceWorkerGlobalScope).clients = new WebviewClientManagerWrapper();