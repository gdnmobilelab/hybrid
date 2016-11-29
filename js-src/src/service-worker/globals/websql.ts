import * as customOpenDatabase from 'websql/custom';

// regretting using typescript right now.
let custOpen = (customOpenDatabase.default || customOpenDatabase)

class CustomImplementation {

    private db:any;

    constructor(name:string) {
        console.log('TRYING TO CREATE DB')
        let returnArray = __WebSQLDatabaseCreator.createDB(name);
        if (returnArray[0]) {
            throw returnArray[0];
        }
        this.db = returnArray[1];
    }

    exec()  {
        console.log("QUERY:", arguments[0])
        this.db.execReadOnlyCallback.apply(this.db, arguments);
    }
}
let openDatabase = custOpen(CustomImplementation);
export default openDatabase;
global.openDatabase = openDatabase;