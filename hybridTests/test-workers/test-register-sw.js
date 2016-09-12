self.addEventListener("install", function() {
    self.skipWaiting();
})

self.addEventListener("activate", function(e) {
    e.waitUntil(self.clients.claim());
})

self.addEventListener("message", function(ev) {
    ev.ports[0].postMessage(1)
})
