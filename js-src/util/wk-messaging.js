export function send(obj) {
    window.webkit.messageHandlers.hybrid.postMessage(obj);
}
