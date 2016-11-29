// import './idb.js';
import * as openDatabase from './websql';
import * as indexeddb from 'indexeddbshim/node6/node.js';

// regretting using typescript right now.
let idb = (indexeddb.default || indexeddb);
// let odb = (openDatabase.default || openDatabase);
// (window as any).shimIndexedDB.__debug(true)

let applyToScope = idb(openDatabase);
applyToScope(global);
