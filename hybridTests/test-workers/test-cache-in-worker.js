self.addEventListener("activate", function(event) {
    event.waitUntil(
        caches.open("test-cache")
        .then(function(cache) {
            return cache.addAll(["http://localhost:9111/text-file.txt"])
        })
    )
})

self.addEventListener("fetch", function(event){
    event.respondWith(
        caches.open("test-cache")
        .then(function(cache){
            return cache.match(event.request.url)
        })
        .catch(function() {
            return new Response("NOT FOUND")
        })
        // .then(function(response){
        //     return 
        // })
                      
    )
})