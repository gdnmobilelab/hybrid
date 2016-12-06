if (parseInt(process.version[1],10) < 6) {
    throw new Error("Node 6 or higher is required to run this script");
}

const fs = require('fs');
const path = require('path');
const addWorker = require('./add-worker');
const workerToSQL = require('./worker-to-sql');
const plist = require('plist');

// We can use ${VARIABLE} subtitution in our JSON file, just like we can in
// plists and the like.
function injectVariablesIntoString(str) {
    let matcher = /\$\{(.+?)\}/

    return str.replace(matcher, (match, name, offset, wholeString) => {
        if (!process.env[name]) {
             throw new Error(`Tried to use environment variable ${name}, but it is not defined.`);
        }
        return process.env[name];
    })

}

// We only want to bundle one worker preload migration with an app release, so we'll clear out
// any that already exist.
function removeExistingWorkerPreloads(dir) {
    let entries = fs.readdirSync(dir);
    entries.forEach((file) => fs.unlinkSync(path.join(dir,file)));
}

const configFile = require(process.argv[2]);
const storeDirectory = process.argv[3];

const workersToPreload = configFile[process.env["CONFIGURATION"] == "Debug" ? "debug" : "release"];

removeExistingWorkerPreloads(storeDirectory);

if (workersToPreload.length == 0) {
    console.info("No workers to preload")
    process.exit(0);
}

let workerLoadPromises = workersToPreload.map(({src, scope}) => {
    return addWorker({src, scope});
})

Promise.all(workerLoadPromises)
.then((workers) => {

    let d = new Date();
    let pad = (s) => {
        let asString = String(s);
        if (asString.length == 1) {
            return "0" + asString;
        }
        return asString;
    }

    let migrationVersionBase = [
        d.getFullYear(),
        pad(d.getMonth()+1),
        pad(d.getDate()),
        pad(d.getHours()),
        pad(d.getMinutes()),
        pad(d.getSeconds())
    ].join("")

    workers.forEach((worker, i) => {
        let allSQL = workerToSQL(worker).join(';\n\n');
        fs.writeFileSync(path.join(storeDirectory, "worker_" + migrationVersionBase + pad(i) + ".sql"), allSQL);
    });

    

    

    let entries = workers.map((worker,i) => {
        return {
            url: worker.src,
            scope: worker.scope,
            file: migrationVersionBase + pad(i)
        }
    })

    fs.writeFileSync(path.join(storeDirectory, "workers.plist"), plist.build(entries))

    process.exit(0);
})