import './include'

let selfAsAny = self as any;



// selfAsAny.promiseBridge = function(callbackIndex:number, promise: Promise<any>) {
//     promise
//     .then((response) => {
//         __promiseCallback(callbackIndex, null, response)
//     })
//     .catch((err) => {
//         __promiseCallback(callbackIndex, err.message)
//     })
// }