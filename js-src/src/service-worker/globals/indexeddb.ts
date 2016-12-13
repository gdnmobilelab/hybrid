// import './idb.js';
import openDatabase from './websql';
import indexeddb from 'indexeddbshim-node6/rollup-ready/node.js';

let applyToScope = indexeddb(openDatabase);
applyToScope(global);
