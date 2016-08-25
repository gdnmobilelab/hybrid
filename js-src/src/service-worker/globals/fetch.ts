import * as url from 'url';


function promisifyFunction(obj:any, nameOfFunction:string) {
    let originalFunction = obj.prototype[nameOfFunction + "ErrorCallback"] as Function;

    if (!originalFunction) {
        throw new Error("Original function " + nameOfFunction + "ErrorCallback does not exist!")
    }

    obj.prototype[nameOfFunction] = function() {
        let argsAsArray = Array.prototype.slice.call(arguments) as Array<any>;

        return new Promise((fulfill, reject) => {
            argsAsArray.push(fulfill, function(err:string) {
                return new Error(err);
            });
            originalFunction.apply(this, argsAsArray);
        })
    }
}

promisifyFunction(Response, "json");
promisifyFunction(Response, "text");
promisifyFunction(Request, "json");
promisifyFunction(Request, "text");

GlobalFetch.fetch = function(urlToFetch:string, options:any) {
    return new Promise((fulfill, reject) => {

        let resolvedURL = url.resolve(self.registration.scope, urlToFetch);

        GlobalFetch.fetchOptionsCallbackErrorCallback(resolvedURL, options, fulfill, (err:string) => reject(new Error(err)))
    })
}

global.fetch = GlobalFetch.fetch