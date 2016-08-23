import * as es6Promise from 'es6-promise';

global.Promise = es6Promise.Promise;

global.__bind = function(obj:any, funcName:string) {
    return obj[funcName].bind(obj)
}