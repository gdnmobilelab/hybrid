import {emitWithWaitUntil} from '../../src/service-worker/wait-until';
import events from 'events';
import assert from 'assert';

describe("Wait until", function() {
    it("should wait for a promise when waitUntil is invoked", () => {
        let ee = new events.EventEmitter()

        let promiseWasTriggered = false;
        ee.on('test', function(event) {
            event.waitUntil(new Promise((fulfill, reject) => {
                promiseWasTriggered = true;
                fulfill();
            }))
        })

        return emitWithWaitUntil.bind(ee)("test", {})
        .then(() => {
            assert.equal(promiseWasTriggered, true)
        })
    })

    it("should return immediately when waitUntil is not used", () => {
        let ee = new events.EventEmitter()

        let eventWasTriggered = false;
        ee.on('test', function(event) {
            eventWasTriggered = true;
        })

        return emitWithWaitUntil.bind(ee)("test", {})
        .then(() => {
            assert.equal(eventWasTriggered, true)
        })
    })
})