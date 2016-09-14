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

var testPostMessage = function() {
    console.log("Testing posting message to web client")
    return clients.matchAll()
    .then(function(clients) {
          return new Promise(function(fulfill, reject){
                let channel = new MessageChannel();
                             
                channel.port2.onmessage = function(msg) {
                             debugger;
                   fulfill(msg.data)
                }
                             
                clients[0].postMessage("hello", [channel.port1])
          })
    })
}
