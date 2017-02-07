(function (exports) {
'use strict';

// describe("Fetch Headers", () => {
//     it("Should fire a test", () => {
//         return true;
//     })
// })

var pendingTestSuites = [];

function getAllTests() {
    return pendingTestSuites;
}

function provide(testsTitle, obj) {

    pendingTestSuites.push({
        name: testsTitle,
        tests: obj
    });

}

provide("Fetch API", {
    "fetches a response": function() {
        throw new Error("turds!")
    }
})

function runAllFunctionsInObject(obj) {
    var keys = Object.keys(obj);

    var mappedToPromises = keys.map(function (key) {


        return Promise.resolve()
        .then(function () {
            return obj[key]();
        })
        .then(function (result) {
            return {
                success: true
            }
        })
        .catch(function (err) {
            return {
                success: false,
                error: err.message
            }
        })
    });

    return Promise.all(mappedToPromises)
    .then(function (results) {

        var resultsObject = {};

        results.forEach(function (result, idx) {

            var key = keys[idx];

            resultsObject[key] = result;

        });

        return resultsObject;

    })

}

var allSuites = getAllTests();

var suitesPromises = allSuites.map(function (suite) {
    return runAllFunctionsInObject(suite.tests)
    .then(function (results) {
        return {
            name: suite.name,
            results: results
        }
    })
})


function runTests() {
    return Promise.all(suitesPromises)
    .then(function (results) {
        console.log(JSON.stringify(results, null, 2))
    })
}

exports.runTests = runTests;

}((this.tests = this.tests || {})));