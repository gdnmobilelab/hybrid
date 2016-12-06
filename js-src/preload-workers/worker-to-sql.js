const knex = require('knex')({
    client:'sqlite3',
    useNullAsDefault: true
});

module.exports = function(workerEntry) {

    let sqls = [];

    let workerInsert = knex("service_workers")
        .insert({
            url: workerEntry.src,
            scope: workerEntry.scope,
            last_checked: Math.round(workerEntry.lastChecked / 1000), // Swift stores seconds, not milliseconds
            contents: workerEntry.contents,
            install_state: 1 // installed
        }).toString();

    sqls.push(workerInsert);

    workerEntry.caches.forEach((cache) => {
        cache.entries.forEach((entry) => {
            let cacheInsert = knex("cache")
            .insert({
                service_worker_url: workerEntry.src,
                cache_id: cache.name,
                resource_url: entry.url,
                headers: JSON.stringify(entry.headers),
                status: entry.status,
                contents: knex.raw("X'" + entry.buffer.toString("hex") + "'")
            }).toString()

            sqls.push(cacheInsert);
        })
    })

    return sqls;
}
