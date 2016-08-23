import * as customOpenDatabase from 'websql/custom';

// regretting using typescript right now.
let custOpen = (customOpenDatabase.default || customOpenDatabase)

class CustomImplementation {

    private db:any;

    constructor(name:string) {
        let returnArray = __WebSQLDatabaseCreator.createDB(name);
        if (returnArray[0]) {
            throw returnArray[0];
        }
        this.db = returnArray[1];
    }

    exec()  {
        this.db.execReadOnlyCallback.apply(this.db, arguments);
    }
}

global.openDatabase = custOpen(CustomImplementation);
export default global.openDatabase;
