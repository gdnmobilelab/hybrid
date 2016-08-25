import {notification} from '../notification/notification'
import promiseBridge from '../notification/notification-bridge';

export class HybridPushManager implements PushManager {

    subscribe(): Promise<PushSubscription> {
        throw new Error("not yet")
    }

    getSubscription(): Promise<PushSubscription> {
        throw new Error("not yet")
    }

    hasPermission():Promise<any> {
        // is a deprecated method, but sometimes still used
        return this.permissionState();
    }

    permissionState():Promise<any> {
        let status = notification.permission;
        if (status == "default") {
            status = "prompt";
        }
        return Promise.resolve(status);
    }
}