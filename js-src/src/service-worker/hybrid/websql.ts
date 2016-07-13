import * as customOpenDatabase from 'websql/custom';

// regretting using typescript right now.
let custOpen = (customOpenDatabase.default || customOpenDatabase)

interface SQLQuery {
    sql: string;
    args: [any]
}

interface SQLResultSet {
    rows: [any];
    rowsAffected: number;
    insertId: number;
}

class CustomImplementation {

    private name:string;
    private nativeDbId:number;

    constructor(name:string) {
        
        this.name = name;
        this.nativeDbId = __createWebSQLConnection(this.name);
    }

    exec(queries:[SQLQuery], readOnly:Boolean, callback:(error:Error, results:any) => void)  {
        let queriesAsJSON = JSON.stringify(queries);
        let resultJSON = __execDatabaseQuery(this.nativeDbId, queriesAsJSON, readOnly);
    
        let results:any = JSON.parse(resultJSON);
        console.log("return from exec", results)
        return callback(null, results);
    }
}


hybrid.openDatabase = custOpen(CustomImplementation);
export default hybrid.openDatabase;