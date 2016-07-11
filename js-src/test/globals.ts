
import * as assert from 'assert';

describe("Globals", () => {
    it("Should declare globals", () => {
        assert.equal(typeof(ExtendableEvent), 'function');
    })
})