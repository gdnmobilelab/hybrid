
var mochaObj = global.mocha
global.location = {
    search: ""
}


var output = null

global.Mocha.process.stdout._write = function(data, encoding, cb) {
    output = data.toString()
    cb()
}

mochaObj.setup({
    ui: 'bdd',
    reporter: 'json'
})

require('./tests');

global.runTests = function() {
   
    return new Promise(function(fulfill, reject) {
        console.log('running')
        mochaObj.run(function() {
            console.log('ran')
            var parsed = JSON.parse(output)
            // console.log(Object.keys(parsed))
            console.log('pass?', parsed.passes.map(function(f) { return f.title }))
            console.log('fail?', parsed.failures.map(function(f) { return f.title }))
            fulfill(true)
        })
    })
}


// runTests()
// .then((data) => {
//     console.log(data)
// })
