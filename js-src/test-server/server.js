var ServerMock = require('mock-http-server');
var path = require('path');
var fs = require('fs');
const allFilesSync = require('./all-files');
const browserifyBundle = require('./browserify-bundle');

var server = new ServerMock({ host: "localhost", port: 9000 });

let testPath = process.argv[2] ? path.join(process.cwd(), process.argv[2]) : path.join(__dirname, '../test/src');

browserifyBundle({
    server: server,
    paths: [
        path.join(__dirname, '../test/src/utils.js'),
        path.join(__dirname, '../test/bootstrap-client.js'),
        testPath,
        // path.join(__dirname, '../test/src/client')
        
    ],
    servePath: '/browser-tests.js'
})
.then((bundle) => {

    server.on({
        method: 'GET',
        path: '/browser-tests.html',
        reply: {
            status:  200,
            headers: { "content-type": "text/html" },
            body: `
                <body>
                <script src='//localhost:35729/livereload.js'></script>
                
                <script src='browser-tests.js'></script>
                </body>
            `
        }
    })
})


let allMockFiles = allFilesSync(path.join(__dirname, '..', 'test-mocks'))
    .filter((f) => path.extname(f) === ".js");


allMockFiles.forEach((filePath) => {
    console.info("Loading mocks from: " + path.relative(__dirname,filePath))
    let mocks = require(filePath);
    mocks.forEach((mock) => server.on(mock));

})
server.start(() => {
    console.log("Server ready.")
});