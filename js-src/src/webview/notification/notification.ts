import promiseBridge from './notification-bridge';

export const notification = {
    permission: "unknown",
    requestPermission: function(callback: Function) {
     

       return promiseBridge.bridgePromise({
            operation: "requestPermission"
       })
       .then((newStatus) => {
           // Support deprecated callback method
           if (callback) {
               callback(newStatus);
           }
           return newStatus
       })
    },

    // This is just used for feature sniffing
    prototype: {
        image: "",
        video: "",
        canvas: "",
        collapsed: ""
    }
};

promiseBridge.bridgePromise({
    operation: "getStatus"
})
.then((status:string) => {
    // console.debug("Notification permission:", status)
    notification.permission = status;
});

promiseBridge.on("notification-permission-change", (newStatus:string) => {
    // console.debug("Received updated notification permission:" + newStatus);
    notification.permission = status;
});

(window as any).Notification = notification;