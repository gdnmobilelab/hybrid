self.addEventListener("install", function() {
    console.log("INSTALL SW VERSION TWO SKIP WAITING?")
    self.skipWaiting()
})

self.addEventListener("activate", function() {
    self.clients.claim();
})