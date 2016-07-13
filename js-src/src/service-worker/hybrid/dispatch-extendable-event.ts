
hybrid.dispatchExtendableEvent = function(name:string, data:Object) {
    let extendedEvent = new ExtendableEvent(name, data);

    self.dispatchEvent(extendedEvent);

    return extendedEvent.resolve()
}