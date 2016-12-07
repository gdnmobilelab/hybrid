
// The WKWebView load handler includes things like loading images, which we don't
// want to wait for. So instead, we keep track of the readyState change, and send that
// back through a message handler.

const webkit = (window as any).webkit;

document.addEventListener('readystatechange', function() {
    console.log("NEW READYSTATE:", document.readyState)
    webkit.messageHandlers.readyStateHandler.postMessage(document.readyState)
})