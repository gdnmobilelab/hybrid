self.addEventListener("fetch", function(event) {
console.log(JSON.stringify(event))
    if (event.request.url.indexOf("fetch-this-url") > -1) {
        event.respondWith(new Response("FETCHED THIS"))
    } else {
        event.respondWith(new Response("DO NOT KNOW THIS"))
    }
});