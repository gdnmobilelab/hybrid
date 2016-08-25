
self.registration =  __serviceWorkerRegistration;

(self.registration as any).showNotification = function(title:string, options:any) {
    __serviceWorkerRegistration.showNotificationOptions(title, options);
    return Promise.resolve();
}