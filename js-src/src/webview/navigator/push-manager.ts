import {notification} from '../notification/notification'
import promiseBridge from '../notification/notification-bridge';

export class HybridPushManager implements PushManager {

    subscribe(): Promise<PushSubscription> {
        // Currently don't return subscription details on web side
        // - only on service worker side.
        // TODO: fix
        return Promise.resolve(null);
    }

    getSubscription(): Promise<PushSubscription> {
        return Promise.resolve(null);
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