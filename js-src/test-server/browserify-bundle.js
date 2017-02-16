const browserify = require('browserify');
const bubleify = require('bubleify');
const watchify = require('watchify');
const allFilesSync = require('./all-files');
const path = require('path');
const tinyLr = require('tiny-lr');
const fetch = require('node-fetch');

tinyLr().listen(35729, function() {
    console.info("LiveReload listening...")
})

function bundleAndServe(bundle, server, servePath) {
    return new Promise((fulfill, reject) => {
        bundle.bundle((err, js) => {
            if (err) {
                reject(err);
                return
            }

            server.off(servePath)
            server.on({
                method: 'GET',
                path: servePath,
                reply: {
                    status:  200,
                    headers: { "content-type": "text/javascript" },
                    body: js.toString()
                }
            });

            fetch('http://localhost:35729/changed?files=' + servePath)

            fulfill()
        })
    })

    

}

module.exports = function({server, paths, servePath}) {

    let b = browserify({
        insertGlobalVars: {
            test: function(file, dir) {
                return 'require("blue-tape")'
            }
        },
        cache: {},
        packageCache: {},
        plugin: [watchify],
        debug: true
    });
    paths.forEach((pathToScan) => {
        allFilesSync(pathToScan)
        .filter((p) => path.extname(p) === '.js')
        .forEach((p) => {
            console.log('Loading tests from:', path.relative(__dirname,p))
            b.add(p)
        });
    })
    

    b.transform(bubleify);

    b.on('update', () => {
        console.info("Updated...")
        bundleAndServe(b, server, servePath)
        .catch((err) => {
            console.error(err)
        })
    })

    return bundleAndServe(b, server, servePath);

}