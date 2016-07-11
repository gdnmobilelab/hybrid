import {EventEmitter} from 'events';
import * as assert from 'assert';

describe("Extendable Event", function() {

    afterEach(() => {
        EventEmitter.prototype.removeAllListeners.apply(self);
    })

    it("should wait for a promise when waitUntil is invoked", () => {
       
        let promiseWasTriggered = false;
        self.addEventListener('test', function(event:ExtendableEvent) {
            event.waitUntil(new Promise((fulfill, reject) => {
                promiseWasTriggered = true;
                fulfill();
            }))
        })

        let extendedEvent = new ExtendableEvent('test');

        self.dispatchEvent(extendedEvent);

        return extendedEvent.resolve()
        .then((value:any) => {
            assert.equal(promiseWasTriggered, true)
        })
        
    })

    it("should return immediately when waitUntil is not used", () => {
        
        let eventWasTriggered = false;
        self.addEventListener('test', function(event:ExtendableEvent) {
            eventWasTriggered = true;
        })

        let extendedEvent = new ExtendableEvent('test');

        self.dispatchEvent(extendedEvent);
        return extendedEvent.resolve()
        .then(() => {
            assert.equal(eventWasTriggered, true)
        })
        
    })

    it("should throw errors", () => {

        let listener = function() {
            throw new Error("oh no");
        };

        self.addEventListener('test', listener);

        let extendedEvent = new ExtendableEvent('test');

        assert.throws(function() {
            self.dispatchEvent(extendedEvent);
        })

        // For some reason this doesn't remove in the afterEach()
        self.removeEventListener('test', listener)
    })

    it("should catch errors in promises", () => {
        self.addEventListener('test', function(event:ExtendableEvent) {
            event.waitUntil(new Promise((fulfill, reject) => {
                reject(new Error("no"))
            }))
        });

        let evt = new ExtendableEvent('test');
        self.dispatchEvent(evt);

        return evt.resolve()
        .then(() => {
            throw new Error("Should have thrown before here.")
        })
        .catch((err) => {
            assert.equal(err.message, 'no')
        })
    })
})