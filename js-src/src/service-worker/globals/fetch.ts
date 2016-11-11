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
promisifyFunction(Response, "blob");
promisifyFunction(Request, "json");
promisifyFunction(Request, "text");
promisifyFunction(Request, "blob");

GlobalFetch.fetch = function(toFetch:any, options:any) {
    return new Promise((fulfill, reject) => {

        // let actualURL = urlToFetch;
        // if (actualURL instanceof Request) {
        //     actualURL = actualURL.url
        // }

        // let resolvedURL = url.resolve(self.registration.scope, urlToFetch);

        GlobalFetch.fetchOptionsScopeCallbackErrorCallback(toFetch, options, self.registration.scope, fulfill, reject)
    })
}

Headers.prototype.set = Headers.prototype.setValue
Headers.prototype.append = Headers.prototype.appendValue
Headers.prototype.delete = Headers.prototype.deleteValue


global.fetch = GlobalFetch.fetch