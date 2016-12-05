import customOpenDatabase from 'websql/custom';

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
        let args = arguments;
        // The callback has to execute asynchronously, as libraries like treo
        // set event listeners up after calling a query
        setTimeout(() => {
            this.db.execReadOnlyCallback.apply(this.db, args);
        },0);
        
    }
}
let openDatabase = customOpenDatabase(CustomImplementation);
export default openDatabase;
global.openDatabase = openDatabase;