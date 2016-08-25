(self as any).PushMessageData = {};

PushManager.prototype.getSubscription = function() {
    return new Promise((fulfill, reject) => {
        this.getSubscriptionCallbackFailure(fulfill, reject);
    })
    .then((deviceToken:string) => {
        return {
            nativePlatform: "ios",
            token: deviceToken
        }
    })
}