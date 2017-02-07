import { getAllTests } from './framework';

function runAllFunctionsInObject(obj) {
    let keys = Object.keys(obj);

    let mappedToPromises = keys.map((key) => {


        return Promise.resolve()
        .then(() => {
            return obj[key]();
        })
        .then((result) => {
            return {
                success: true
            }
        })
        .catch((err) => {
            return {
                success: false,
                error: err.message
            }
        })
    });

    return Promise.all(mappedToPromises)
    .then((results) => {

        let resultsObject = {};

        results.forEach((result, idx) => {

            let key = keys[idx];

            resultsObject[key] = result;

        });

        return resultsObject;

    })

}

let allSuites = getAllTests();

let suitesPromises = allSuites.map((suite) => {
    return runAllFunctionsInObject(suite.tests)
    .then((results) => {
        return {
            name: suite.name,
            results: results
        }
    })
})


export function runTests() {
    return Promise.all(suitesPromises)
    .then((results) => {
        console.log(JSON.stringify(results, null, 2))
    })
}