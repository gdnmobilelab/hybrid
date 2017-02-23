module.exports = [
    {
        path: '/multiple-scopes/parent/worker.js',
        reply: {
            headers: { "content-type": "text/javascript" },
            body: `
                self.addEventListener('activate', function(e) {
                    e.waitUntil(self.clients.claim())
                })
            `
        }
    },
    {
        path: '/multiple-scopes/parent/load.html',
        reply: {
            headers: { "content-type" : "text/html"},
            body: `
                <body>Dummy page</body>
            `
        }
    },
    {
        path: '/multiple-scopes/parent/child/worker.js',
        reply: {
            headers: { "content-type": "text/javascript" },
            body: `
                self.addEventListener('activate', function(e) {
                    e.waitUntil(self.clients.claim())
                })
            `
        }
    },
    {
        path: '/multiple-scopes/parent/child/load.html',
        reply: {
            headers: { "content-type" : "text/html"},
            body: `
                <body>Dummy page</body>
            `
        }
    }
]