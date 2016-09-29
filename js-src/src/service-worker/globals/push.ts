export class PushMessageData {
    content:string;
    
    constructor(content:string) {
        this.content = content;
    }

    json() {
        return JSON.parse(this.content);
    }

    text() {
        return this.content;
    }
}

(self as any).PushMessageData = PushMessageData;

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