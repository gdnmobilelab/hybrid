
// ObjC calls can't have a dynamic number of arguments like JS can. So we use this
// wrapper to convert the arguments into an array.

(self as any).importScripts = function() {
    let urls = Array.prototype.slice.call(arguments);
    let scripts = (self as any).importArrayOfScripts(urls);
    console.log(scripts)
}