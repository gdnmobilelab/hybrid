module.exports = [
    {
        path: '/static-worker/worker.js',
        reply: {
            headers: { "content-type": "text/javascript" },
            body: `
                
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