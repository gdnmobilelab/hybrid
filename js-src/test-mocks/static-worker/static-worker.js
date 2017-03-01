module.exports = [
    {
        path: '/static-worker/worker.js',
        reply: {
            headers: { "content-type": "text/javascript" },
            body: `
                self.addEventListener('install', function(e) {
                    // Delay install so that we catch the installing state
                    console.log('ev',e)
                    var p = new Promise(function(fulfill,reject) {
                        setTimeout(fulfill, 100);
                    });

                    e.waitUntil(p);
                })

            `
        }
    },
    {
        path: '/static-worker/load.html',
        reply: {
            headers: { "content-type" : "text/html"},
            body: `
                <body>Dummy page</body>
            `
        }
    }
]