import promiseBridge from './notification-bridge';

export const notification = {
    permission: "unknown",
    requestPermission: function() {
       promiseBridge.bridgePromise({
            operation: "requestPermission"
       })
       .then((result) => {
           console.log("request result:", result);
       })
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