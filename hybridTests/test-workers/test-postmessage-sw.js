self.addEventListener("message", function(ev) {
    ev.data.number++;
    ev.ports[0].postMessage(ev.data);
})

self.addEventListener("install", function() {
    self.skipWaiting();
})

self.addEventListener("activate", function() {
    self.clients.claim();
})