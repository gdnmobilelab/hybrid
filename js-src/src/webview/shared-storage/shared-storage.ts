// We have one native bridge, but potentially more than one webview-side bridge
// if we use iframes. So we need to set up a quick storage container
// that actually references the top frame

export let sharedStorage:any;

if (window.top !== window && window.top.location.href) {
    // the href check makes sure we're on same-origin
    sharedStorage = (window.top as any).webkit.messageHandlers.hybrid.sharedStorage;
} else {
    sharedStorage = {};
    (window as any).webkit.messageHandlers.hybrid.sharedStorage = sharedStorage;
}