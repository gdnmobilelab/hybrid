
self.registration =  __serviceWorkerRegistration;

(self.registration as any).showNotification = function(title:string, options:any) {
    __serviceWorkerRegistration.showNotificationOptions(title, options);
    return Promise.resolve();
};

(self.registration as any).update = function() {
    return new Promise((fulfill,reject) => {
        __serviceWorkerRegistration.updateCallbackFailure(fulfill, reject);
    })
}