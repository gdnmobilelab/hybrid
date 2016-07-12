
hybrid.dispatchExtendableEvent = function(name, data) {
    let extendedEvent = new ExtendableEvent(name, data);

    self.dispatchEvent(extendedEvent);

    return extendedEvent.resolve()
}

// self.addEventListener('test', function(e) {
//     e.waitUntil(new Promise(function(fulfill) {
//         fulfill('hello');
//     }));
// })