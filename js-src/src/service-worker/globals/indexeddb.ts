// import './idb.js';
import openDatabase from './websql';
import indexeddb from 'indexeddbshim/rollup-ready/node.js';

let applyToScope = indexeddb(openDatabase);
applyToScope(global);
