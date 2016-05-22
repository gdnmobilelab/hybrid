self.addEventListener('fetch', function(event) {
    if (event.request.url.indexOf('/provided-by-sw.js') > -1) {
        event.respondWith(new Response("document.getElementById('result').innerHTML = 'Service Worker loaded'", {
            headers: {
                'Content-Type': 'application/javascript'
            }
        }))
    }
    else {
        event.respondWith(fetch(event.request))
    }
});

self.addEventListener('install', function() {
    return self.skipWaiting();
})

self.addEventListener('activate', function(event) {
	// `claim()` sets this worker as the active worker for all clients that
	// match the workers scope and triggers an `oncontrollerchange` event for
	// the clients.
	return self.clients.claim();
});